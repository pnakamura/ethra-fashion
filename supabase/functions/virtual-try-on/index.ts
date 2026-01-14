import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { avatarImageUrl, garmentImageUrl, category, tryOnResultId, demoMode, retryCount = 0 } = body;

    // Demo mode: skip auth and DB persistence
    let userId = "demo-user";
    
    if (!demoMode) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("No authorization header");
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );

      if (authError || !user) {
        throw new Error("Unauthorized");
      }
      userId = user.id;
    }

    console.log("Virtual Try-On request:", {
      userId,
      category,
      tryOnResultId,
      demoMode: !!demoMode,
      retryCount,
      hasAvatar: !!avatarImageUrl,
      hasGarment: !!garmentImageUrl,
    });

    if (!avatarImageUrl || !garmentImageUrl) {
      return new Response(
        JSON.stringify({ error: "Avatar image and garment image are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Update status to processing (skip for demo mode)
    if (tryOnResultId && !demoMode) {
      await supabase
        .from("try_on_results")
        .update({ status: "processing" })
        .eq("id", tryOnResultId);
    }

    const startTime = Date.now();

    // Validate image URLs before calling the model
    const validateImageUrl = async (url: string, name: string): Promise<void> => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentType = response.headers.get('content-type') || '';
        const contentLength = response.headers.get('content-length');
        
        console.log(`${name} validation - Status: ${response.status}, ContentType: ${contentType}, Size: ${contentLength}`);
        
        if (!response.ok) {
          throw new Error(`A imagem do ${name} não está acessível (${response.status})`);
        }
        
        if (!contentType.startsWith('image/')) {
          throw new Error(`A URL do ${name} não parece ser uma imagem válida`);
        }
        
        // Check minimum size (e.g., 5KB to avoid tiny/icon images)
        if (contentLength && parseInt(contentLength) < 5000) {
          console.warn(`${name} image seems very small: ${contentLength} bytes`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('imagem')) {
          throw error;
        }
        console.error(`Failed to validate ${name}:`, error);
        // Don't fail on validation errors, let the model handle it
      }
    };

    // Validate both images
    await Promise.all([
      validateImageUrl(avatarImageUrl, 'avatar'),
      validateImageUrl(garmentImageUrl, 'peça'),
    ]);

    // Helper to wait between retries (for rate limiting)
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // ============================================
    // IDM-VTON via Replicate (specialized model)
    // ============================================
    const callIDMVTON = async (): Promise<string | null> => {
      const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
      if (!REPLICATE_API_KEY) {
        console.log("REPLICATE_API_KEY not configured, skipping IDM-VTON");
        return null;
      }

      console.log("Calling IDM-VTON via Replicate (specialized try-on model)...");

      // Map various category inputs to IDM-VTON expected values
      const mapToIdmCategory = (cat: string): string => {
        const normalized = (cat || "").toLowerCase().trim();
        if (["top", "tops", "upper_body", "upper", "shirt", "blouse", "jacket", "coat", "sweater"].includes(normalized)) {
          return "upper_body";
        }
        if (["bottom", "bottoms", "lower_body", "lower", "pants", "skirt", "shorts", "jeans"].includes(normalized)) {
          return "lower_body";
        }
        if (["dress", "dresses", "full_body", "jumpsuit", "romper", "overalls"].includes(normalized)) {
          return "dresses";
        }
        return "upper_body"; // Safe fallback
      };

      const idmCategory = mapToIdmCategory(category);
      console.log(`IDM-VTON category mapping: "${category}" -> "${idmCategory}"`);

      // Always resolve the latest Replicate version at runtime (older pinned versions can break)
      let idmVersion = "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4";
      try {
        const modelRes = await fetch("https://api.replicate.com/v1/models/cuuupid/idm-vton", {
          headers: {
            "Authorization": `Token ${REPLICATE_API_KEY}`,
            "Content-Type": "application/json",
          },
        });
        if (modelRes.ok) {
          const modelJson = await modelRes.json();
          const latest = modelJson?.latest_version?.id;
          if (latest) {
            idmVersion = latest;
            console.log("Resolved IDM-VTON latest version:", idmVersion);
          }
        } else {
          console.warn("Could not resolve IDM-VTON latest version:", modelRes.status);
        }
      } catch (e) {
        console.warn("Failed to resolve IDM-VTON latest version, using pinned version.");
      }

      // Helper function to attempt IDM-VTON with a specific category
      const attemptIdmWithCategory = async (categoryToUse: string): Promise<string | null> => {
        console.log(`Attempting IDM-VTON with category: ${categoryToUse}`);
        
        const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${REPLICATE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: idmVersion,
            input: {
              garm_img: garmentImageUrl,
              human_img: avatarImageUrl,
              category: categoryToUse,
              garment_des: "A fashion garment item",
            },
          }),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error("IDM-VTON create error:", createResponse.status, errorText);
          
          // Handle rate limiting
          if (createResponse.status === 429) {
            const retryAfter = createResponse.headers.get('retry-after');
            throw new Error(`Rate limit: retry after ${retryAfter || '60'} seconds`);
          }
          
          // Handle billing issues
          if (createResponse.status === 402) {
            throw new Error("Replicate credits exhausted");
          }
          
          throw new Error(`IDM-VTON error: ${createResponse.status}`);
        }

        const prediction = await createResponse.json();
        console.log("IDM-VTON prediction created:", prediction.id);

        // Poll for result
        const maxAttempts = 60; // Max 2 minutes
        for (let i = 0; i < maxAttempts; i++) {
          await sleep(2000);

          const statusResponse = await fetch(
            `https://api.replicate.com/v1/predictions/${prediction.id}`,
            {
              headers: {
                "Authorization": `Token ${REPLICATE_API_KEY}`,
              },
            }
          );

          if (!statusResponse.ok) {
            console.error("IDM-VTON status check failed:", statusResponse.status);
            continue;
          }

          const status = await statusResponse.json();
          console.log(`IDM-VTON status (${i + 1}/${maxAttempts}):`, status.status);

          if (status.status === "succeeded") {
            // Handle output as string or array
            let outputUrl = status.output;
            if (Array.isArray(status.output)) {
              outputUrl = status.output[0];
              console.log("IDM-VTON returned array output, using first element");
            }
            
            if (outputUrl && typeof outputUrl === "string") {
              console.log("IDM-VTON succeeded with output:", outputUrl);
              return outputUrl;
            }
            console.log("IDM-VTON succeeded but no valid output URL, output was:", status.output);
            return null;
          }

          if (status.status === "failed") {
            const errorDetail = status.error || 'Unknown error';
            console.error("IDM-VTON failed with error:", errorDetail);
            throw new Error(`IDM-VTON failed: ${errorDetail}`);
          }

          if (status.status === "canceled") {
            throw new Error("IDM-VTON was canceled");
          }
        }

        throw new Error("IDM-VTON timeout after 2 minutes");
      };

      // Try primary category first, then fallback to alternative if it fails
      try {
        const result = await attemptIdmWithCategory(idmCategory);
        if (result) return result;
      } catch (primaryError) {
        const errorMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
        console.log(`Primary category "${idmCategory}" failed: ${errorMsg}`);
        
        // Don't retry on rate limits or billing issues
        if (errorMsg.includes("Rate limit") || errorMsg.includes("credits")) {
          throw primaryError;
        }
        
        // Try alternative category as fallback
        const alternativeCategory = idmCategory === "upper_body" ? "dresses" : 
                                     idmCategory === "lower_body" ? "upper_body" : 
                                     "upper_body";
        
        if (alternativeCategory !== idmCategory) {
          console.log(`Retrying with alternative category: ${alternativeCategory}`);
          try {
            const altResult = await attemptIdmWithCategory(alternativeCategory);
            if (altResult) return altResult;
          } catch (altError) {
            console.log(`Alternative category also failed: ${altError instanceof Error ? altError.message : altError}`);
          }
        }
      }
      
      console.log("IDM-VTON: All category attempts exhausted, returning null");
      return null;
    };

    // ============================================
    // Gemini 3 Pro Image Preview (fallback)
    // ============================================
    const getTryOnPrompt = () => {
      return `You are an expert virtual try-on AI creating fashion photography.

TASK: Seamlessly dress the person in the FIRST image with the garment from the SECOND image.

===== CRITICAL BODY PROPORTION RULES (MUST FOLLOW) =====
- DO NOT widen, stretch, or compress the body in ANY way
- DO NOT shorten the legs or torso
- DO NOT change the width-to-height ratio of the person
- The person's body proportions must be PIXEL-PERFECT identical to the input
- If the input person is slim, the output person must be equally slim
- If the input person is tall, the output person must be equally tall
- NEVER make the body look squashed, flattened, or widened

===== ASPECT RATIO LOCK (MANDATORY) =====
- Input image aspect ratio MUST EXACTLY equal output aspect ratio
- If input is 3:4 portrait (width < height), output MUST be 3:4 portrait
- NEVER output a square or landscape image from a portrait input
- Output dimensions should match input dimensions as closely as possible

===== IDENTITY PRESERVATION =====
1. EXACT same face, hair color, hairstyle, skin tone - unchanged
2. EXACT same body shape, weight, and proportions - unchanged  
3. EXACT same pose, arm positions, leg positions - unchanged
4. EXACT same background and lighting conditions - unchanged
5. The person should look 100% recognizable as the same individual

===== GARMENT APPLICATION =====
- Replace ONLY the garment while preserving everything else
- The garment should drape naturally on the body
- Maintain realistic fabric texture, wrinkles, and shadows
- The fit should look natural, not pasted or floating

===== OUTPUT REQUIREMENTS =====
- Single photorealistic image
- VERTICAL (portrait) orientation matching input
- Full body visible from head to feet
- Professional fashion photography quality
- No cropping of head, face, or feet

CRITICAL: The output person must have IDENTICAL body proportions to the input. Any distortion is unacceptable.`;
    };

    const callGeminiPremium = async (): Promise<string | null> => {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        console.log("LOVABLE_API_KEY not configured, skipping Gemini Premium");
        return null;
      }

      console.log("Calling Gemini 3 Pro Image Preview (fallback model)...");

      const response = await fetch(LOVABLE_AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: getTryOnPrompt() },
                { type: "image_url", image_url: { url: avatarImageUrl } },
                { type: "image_url", image_url: { url: garmentImageUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini Premium error:", response.status, errorText);
        throw new Error(`Gemini Premium error: ${response.status}`);
      }

      return extractImageFromResponse(await response.json(), "Gemini Premium");
    };

    // Helper to extract image from Lovable AI response
    const extractImageFromResponse = (data: any, modelName: string): string | null => {
      console.log(`${modelName} response:`, JSON.stringify(data).slice(0, 500));

      const choice = data.choices?.[0];
      const message = choice?.message;
      
      // Format 1: images array
      const imageFromArray = message?.images?.[0]?.image_url?.url;
      if (imageFromArray) {
        console.log(`${modelName} returned image via images array`);
        return imageFromArray;
      }

      // Format 2: content array with image_url
      if (Array.isArray(message?.content)) {
        for (const part of message.content) {
          if (part.type === "image_url" && part.image_url?.url) {
            console.log(`${modelName} returned image via content array`);
            return part.image_url.url;
          }
        }
      }

      // Format 3: inline_data in content
      if (Array.isArray(message?.content)) {
        for (const part of message.content) {
          if (part.type === "image" && part.inline_data?.data) {
            const mimeType = part.inline_data.mime_type || "image/png";
            const base64Url = `data:${mimeType};base64,${part.inline_data.data}`;
            console.log(`${modelName} returned image via inline_data`);
            return base64Url;
          }
        }
      }

      console.log(`${modelName} did not return an image in expected format`);
      return null;
    };

    try {
      let output: string | null = null;
      let usedModel = 'unknown';

      // ============================================
      // Model selection strategy:
      // - First attempt (retryCount=0): IDM-VTON (specialized)
      // - Retry attempts (retryCount>0): Gemini Premium (fallback)
      // - Automatic fallback if IDM-VTON fails
      // ============================================
      
      const tryWithCascadingFallback = async () => {
        // First attempt: try IDM-VTON (specialized model)
        if (retryCount === 0) {
          try {
            console.log("Attempt 1: Trying IDM-VTON (specialized model)...");
            const idmResult = await callIDMVTON();
            if (idmResult) {
              output = idmResult;
              usedModel = 'IDM-VTON';
              console.log("IDM-VTON succeeded!");
              return;
            }
            console.log("IDM-VTON returned null, falling back to Gemini...");
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`IDM-VTON failed: ${errorMsg}, falling back to Gemini...`);
            
            // If rate limited, wait before fallback
            if (errorMsg.includes("Rate limit")) {
              await sleep(5000);
            }
          }
        }

        // Fallback or retry: use Gemini Premium
        console.log("Using Gemini 3 Pro Image Preview...");
        try {
          const geminiResult = await callGeminiPremium();
          if (geminiResult) {
            output = geminiResult;
            usedModel = 'gemini-3-pro-image-preview';
            console.log("Gemini Premium succeeded!");
            return;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`Gemini Premium failed: ${errorMsg}`);
          throw error;
        }
      };

      await tryWithCascadingFallback();

      const processingTime = Date.now() - startTime;
      console.log(`${usedModel} completed in`, processingTime, "ms");

      // The output is the URL of the generated image
      const resultImageUrl = output;
      
      if (!resultImageUrl) {
        throw new Error("Nenhum modelo conseguiu gerar a imagem. Verifique se a foto do avatar mostra uma pessoa de corpo inteiro.");
      }

      // Update the try_on_results record (skip for demo mode)
      if (tryOnResultId && !demoMode) {
        await supabase
          .from("try_on_results")
          .update({
            status: "completed",
            result_image_url: resultImageUrl,
            processing_time_ms: processingTime,
            model_used: usedModel,
            retry_count: retryCount,
          })
          .eq("id", tryOnResultId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          resultImageUrl,
          processingTimeMs: processingTime,
          model: usedModel,
          retryCount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (modelError) {
      const processingTime = Date.now() - startTime;
      const errorMsg = modelError instanceof Error ? modelError.message : String(modelError);
      console.error("Virtual try-on model error:", errorMsg);
      
      // Provide user-friendly error messages
      let userMessage = "Falha ao processar prova virtual.";
      const isRateLimit = errorMsg.includes("429") || errorMsg.includes("Too Many Requests") || errorMsg.includes("rate limit") || errorMsg.includes("Rate limit");

      if (errorMsg.includes("Failed to process") || errorMsg.includes("Nenhum modelo")) {
        userMessage = "Não foi possível processar a imagem. Use uma foto de corpo inteiro com boa iluminação e fundo simples.";
      } else if (errorMsg.includes("402") || errorMsg.includes("credits")) {
        userMessage = "Créditos insuficientes no serviço de IA. Tente novamente em alguns minutos.";
      } else if (isRateLimit) {
        userMessage = "Limite de requisições atingido. Aguarde alguns segundos e tente novamente.";
      } else if (errorMsg.includes("imagem")) {
        userMessage = errorMsg; // Already a user-friendly message from validation
      } else if (errorMsg.includes("IDM-VTON failed")) {
        userMessage = "O modelo especializado não conseguiu processar. Tente novamente para usar o modelo alternativo.";
      }
      
      // Update status to failed (skip for demo mode)
      if (tryOnResultId && !demoMode) {
        await supabase
          .from("try_on_results")
          .update({ 
            status: "failed", 
            error_message: userMessage,
            processing_time_ms: processingTime,
            model_used: 'failed',
            retry_count: retryCount,
          })
          .eq("id", tryOnResultId);
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: userMessage,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: isRateLimit ? 429 : 400,
        }
      );
    }
  } catch (error) {
    console.error("Virtual try-on error:", error);
    const errorMessage = error instanceof Error ? error.message : "Falha ao processar prova virtual";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
