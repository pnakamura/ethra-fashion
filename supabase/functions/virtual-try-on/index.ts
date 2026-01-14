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
      
      // Determine category for IDM-VTON
      const idmCategory = category === "upper_body" ? "upper_body" : 
                          category === "lower_body" ? "lower_body" : 
                          category === "dresses" ? "dresses" : "upper_body";

      const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${REPLICATE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
          input: {
            garm_img: garmentImageUrl,
            human_img: avatarImageUrl,
            category: idmCategory,
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
          const outputUrl = status.output;
          if (outputUrl) {
            console.log("IDM-VTON succeeded with output:", outputUrl);
            return outputUrl;
          }
          console.log("IDM-VTON succeeded but no output URL");
          return null;
        }

        if (status.status === "failed") {
          console.error("IDM-VTON failed:", status.error);
          throw new Error(`IDM-VTON failed: ${status.error || 'Unknown error'}`);
        }

        if (status.status === "canceled") {
          throw new Error("IDM-VTON was canceled");
        }
      }

      throw new Error("IDM-VTON timeout after 2 minutes");
    };

    // ============================================
    // Gemini 3 Pro Image Preview (fallback)
    // ============================================
    const getTryOnPrompt = () => {
      return `You are an expert virtual try-on AI creating fashion photography.

TASK: Seamlessly dress the person in the FIRST image with the garment from the SECOND image.

ABSOLUTE REQUIREMENTS:
1. OUTPUT MUST BE VERTICAL (PORTRAIT) - Same orientation as the person photo
2. FULL BODY: Show complete person HEAD TO FEET - never crop head or face
3. EXACT ASPECT RATIO: Match the first image dimensions precisely
4. PRESERVE IDENTITY: Keep face, hair, skin tone, body shape, pose unchanged
5. NATURAL FIT: The garment should look naturally worn, not pasted on
6. PHOTOREALISTIC: Professional fashion photography quality

PREMIUM QUALITY REQUIREMENTS:
- Ultra-high resolution output
- Perfect fabric texture and draping
- Accurate lighting and shadows
- Flawless blend between garment and body
- Studio-quality fashion photography finish

CRITICAL: Output a SINGLE image with VERTICAL orientation matching the input person photo.`;
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
