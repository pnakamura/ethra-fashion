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
    const { 
      avatarImageUrl, 
      garmentImageUrl, 
      category, 
      tryOnResultId, 
      demoMode, 
      retryCount = 0,
      strategy = 'cascade' // 'cascade' | 'race' | 'onboarding'
    } = body;

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
      strategy,
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

      // Generate detailed garment description based on category to improve model focus
      const getGarmentDescription = (cat: string): string => {
        const normalized = (cat || "").toLowerCase();
        if (["top", "shirt", "blouse", "t-shirt", "camiseta"].some(t => normalized.includes(t))) {
          return "A stylish upper body garment, focus on fabric drape and fit on torso only, preserve hands exactly as they are";
        }
        if (["dress", "vestido"].some(t => normalized.includes(t))) {
          return "An elegant dress, focus on how it fits the body silhouette, preserve hands and arms exactly";
        }
        if (["jacket", "coat", "blazer", "jaqueta", "casaco"].some(t => normalized.includes(t))) {
          return "A tailored outerwear piece, emphasize shoulder fit and lapel details, keep hands untouched";
        }
        if (["pants", "jeans", "shorts", "calça", "bermuda"].some(t => normalized.includes(t))) {
          return "A lower body garment, focus on fit around waist and legs only";
        }
        return "A fashion garment, focus on natural fabric drape on the body, do not modify hands or fingers";
      };

      // Helper function to attempt IDM-VTON with a specific category
      const attemptIdmWithCategory = async (categoryToUse: string): Promise<string | null> => {
        console.log(`Attempting IDM-VTON with category: ${categoryToUse}`);
        
        const garmentDescription = getGarmentDescription(category);
        console.log(`Using garment description: "${garmentDescription}"`);
        
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
              garment_des: garmentDescription,
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
    // Vertex AI Virtual Try-On (Google Cloud)
    // ============================================
    const callVertexAI = async (): Promise<string | null> => {
      const credentialsJson = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");
      if (!credentialsJson) {
        console.log("GOOGLE_APPLICATION_CREDENTIALS_JSON not configured, skipping Vertex AI");
        return null;
      }

      console.log("Calling Vertex AI Virtual Try-On...");

      try {
        // Call the vertex-try-on edge function
        const vertexResponse = await fetch(
          `${supabaseUrl}/functions/v1/vertex-try-on`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              avatarImageUrl,
              garmentImageUrl,
              category,
            }),
          }
        );

        if (!vertexResponse.ok) {
          const errorText = await vertexResponse.text();
          console.error("Vertex AI error:", vertexResponse.status, errorText);
          
          if (vertexResponse.status === 429) {
            throw new Error("Vertex AI rate limit");
          }
          throw new Error(`Vertex AI error: ${vertexResponse.status}`);
        }

        const result = await vertexResponse.json();
        
        if (result.success && result.resultImageUrl) {
          console.log("Vertex AI succeeded!");
          return result.resultImageUrl;
        }

        console.log("Vertex AI returned no image:", result.error);
        return null;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Vertex AI failed:", errorMsg);
        throw error;
      }
    };

    // ============================================
    // Gemini 3 Pro Image Preview (fallback)
    // ============================================
    const getTryOnPrompt = () => {
      // Fixed dimensions matching frontend preprocessing
      const WIDTH = 768;
      const HEIGHT = 1024;
      
      return `You are an expert virtual fashion photography AI.

TASK: Create a single image showing the person from image 1 wearing the garment from image 2.

===== MANDATORY OUTPUT SPECIFICATIONS =====
OUTPUT DIMENSIONS: Exactly ${WIDTH} pixels wide by ${HEIGHT} pixels tall
ASPECT RATIO: Exactly 3:4 portrait (0.75)
ORIENTATION: Vertical/Portrait ONLY

===== ABSOLUTE BODY PROPORTION RULES =====
CRITICAL: The person's body must have IDENTICAL proportions to the input image.

DO NOT:
- Widen the body horizontally
- Compress or flatten the torso
- Shorten or lengthen the legs
- Change the shoulder width
- Alter the hip width
- Squash or stretch the person vertically
- Change the head-to-body ratio

THE OUTPUT BODY WIDTH IN PIXELS MUST EQUAL THE INPUT BODY WIDTH IN PIXELS.
THE OUTPUT BODY HEIGHT IN PIXELS MUST EQUAL THE INPUT BODY HEIGHT IN PIXELS.

===== IDENTITY PRESERVATION (NON-NEGOTIABLE) =====
These must be PIXEL-PERFECT identical to input:
- Face features, expression
- Skin tone, skin texture
- Hair color, hairstyle, hair position
- Body shape, weight, curves
- Pose (exact arm and leg positions)
- Hand positions and gestures

===== ANATOMICAL ACCURACY - HANDS (CRITICAL) =====
HANDS MUST BE ANATOMICALLY CORRECT AND IDENTICAL TO THE INPUT.

RULES FOR HANDS:
- Each hand MUST have exactly 5 fingers
- Fingers must have correct proportions and natural joints
- Preserve the EXACT hand pose from the input image
- Do NOT merge, fuse, or add extra fingers
- Do NOT distort hand positions, wrists, or gestures
- Do NOT regenerate or reimagine hands - copy them EXACTLY
- Focus the garment change on the TORSO ONLY, leave hands untouched

NEGATIVE (avoid at all costs):
- Extra fingers, missing fingers, fused fingers
- Malformed hands, twisted wrists
- Unnatural hand poses or finger positions
- Blurry or undefined hand details

===== GARMENT APPLICATION =====
- Replace ONLY the clothing on the upper body/torso area
- The garment should drape naturally following the body's contours
- Add natural fabric shadows and wrinkles
- Maintain realistic lighting matching the original photo
- The garment edges should blend seamlessly
- DO NOT modify arms, hands, or any body parts - only the garment

===== BACKGROUND =====
- Keep the EXACT same background as the input
- Do not change lighting conditions
- Do not add or remove any background elements

===== FINAL OUTPUT =====
- One single photorealistic image
- Dimensions: ${WIDTH}x${HEIGHT} pixels exactly
- Full body visible (head to at least mid-thigh)
- Fashion editorial quality
- No text, watermarks, or artifacts

CRITICAL REMINDER: Any body proportion distortion (widening, flattening, stretching) or hand deformation is a FAILURE. The person must look IDENTICAL except for the new garment.`;
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

    // ============================================
    // Result validation helper
    // ============================================
    const validateResult = (imageUrl: string | null): boolean => {
      if (!imageUrl || imageUrl.length < 20) return false;
      if (imageUrl.startsWith('data:')) {
        return imageUrl.includes('base64') && imageUrl.length > 100;
      }
      // URL format - basic validation
      return imageUrl.startsWith('http');
    };

    try {
      let output: string | null = null;
      let usedModel = 'unknown';

      // ============================================
      // STRATEGY 1: Cascading Fallback (original)
      // Sequential: IDM-VTON → Vertex AI → Gemini
      // ============================================
      const tryWithCascadingFallback = async () => {
        // Attempt 1: Try IDM-VTON (specialized model)
        if (retryCount === 0) {
          try {
            console.log("[CASCADE] Attempt 1: Trying IDM-VTON...");
            const idmResult = await callIDMVTON();
            if (validateResult(idmResult)) {
              output = idmResult;
              usedModel = 'IDM-VTON';
              console.log("[CASCADE] IDM-VTON succeeded!");
              return;
            }
            console.log("[CASCADE] IDM-VTON returned invalid result, trying next...");
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`[CASCADE] IDM-VTON failed: ${errorMsg}`);
            if (errorMsg.includes("Rate limit")) await sleep(5000);
          }
        }

        // Attempt 2: Try Vertex AI (Google Cloud)
        if (retryCount <= 1) {
          try {
            console.log("[CASCADE] Attempt 2: Trying Vertex AI...");
            const vertexResult = await callVertexAI();
            if (validateResult(vertexResult)) {
              output = vertexResult;
              usedModel = 'vertex-ai-imagen';
              console.log("[CASCADE] Vertex AI succeeded!");
              return;
            }
            console.log("[CASCADE] Vertex AI returned invalid result, trying Gemini...");
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`[CASCADE] Vertex AI failed: ${errorMsg}`);
          }
        }

        // Attempt 3: Gemini Premium (final fallback)
        console.log("[CASCADE] Attempt 3: Using Gemini 3 Pro...");
        try {
          const geminiResult = await callGeminiPremium();
          if (validateResult(geminiResult)) {
            output = geminiResult;
            usedModel = 'gemini-3-pro-image-preview';
            console.log("[CASCADE] Gemini Premium succeeded!");
            return;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[CASCADE] Gemini Premium failed: ${errorMsg}`);
          throw error;
        }
      };

      // ============================================
      // STRATEGY 2: Race (Quality-First Parallel)
      // Parallel: Vertex + Gemini race, then IDM-VTON backup
      // ============================================
      const tryWithRaceStrategy = async () => {
        console.log("[RACE] Starting parallel race strategy...");
        
        // Group 1: Google models in parallel (faster, more reliable)
        const googlePromises = [
          callVertexAI().catch(e => { console.log("[RACE] Vertex failed:", e.message); return null; }),
          callGeminiPremium().catch(e => { console.log("[RACE] Gemini failed:", e.message); return null; }),
        ];
        
        const raceStartTime = Date.now();
        const googleResults = await Promise.all(googlePromises);
        const googleDuration = Date.now() - raceStartTime;
        console.log(`[RACE] Google parallel completed in ${googleDuration}ms`);
        
        // Find first valid result from Google
        const vertexResult = googleResults[0];
        const geminiResult = googleResults[1];
        
        if (validateResult(vertexResult)) {
          output = vertexResult;
          usedModel = 'vertex-ai-imagen';
          console.log("[RACE] Vertex AI won the race!");
          return;
        }
        
        if (validateResult(geminiResult)) {
          output = geminiResult;
          usedModel = 'gemini-3-pro-image-preview';
          console.log("[RACE] Gemini won the race!");
          return;
        }
        
        // If both Google models failed, try IDM-VTON as backup
        console.log("[RACE] Google models failed, trying IDM-VTON backup...");
        try {
          const idmResult = await callIDMVTON();
          if (validateResult(idmResult)) {
            output = idmResult;
            usedModel = 'IDM-VTON';
            console.log("[RACE] IDM-VTON backup succeeded!");
            return;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(`[RACE] IDM-VTON backup failed: ${errorMsg}`);
        }
        
        throw new Error("Nenhum modelo conseguiu gerar a imagem no modo race.");
      };

      // ============================================
      // STRATEGY 3: Onboarding (Fast, No Cost)
      // Gemini-first with 35s timeout, Vertex fallback
      // ============================================
      const tryWithOnboardingStrategy = async () => {
        const ONBOARDING_TIMEOUT = 35000; // 35 seconds
        console.log("[ONBOARDING] Starting optimized onboarding strategy...");
        
        // Try Gemini first (no external cost, always available)
        try {
          console.log("[ONBOARDING] Trying Gemini with 35s timeout...");
          const geminiPromise = callGeminiPremium();
          const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), ONBOARDING_TIMEOUT)
          );
          
          const geminiResult = await Promise.race([geminiPromise, timeoutPromise]);
          
          if (validateResult(geminiResult)) {
            output = geminiResult;
            usedModel = 'gemini-3-pro-image-preview';
            console.log("[ONBOARDING] Gemini succeeded!");
            return;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(`[ONBOARDING] Gemini failed/timeout: ${errorMsg}`);
        }
        
        // Fallback to Vertex AI if Gemini fails
        console.log("[ONBOARDING] Trying Vertex AI fallback...");
        try {
          const vertexResult = await callVertexAI();
          if (validateResult(vertexResult)) {
            output = vertexResult;
            usedModel = 'vertex-ai-imagen';
            console.log("[ONBOARDING] Vertex AI fallback succeeded!");
            return;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(`[ONBOARDING] Vertex AI fallback failed: ${errorMsg}`);
        }
        
        throw new Error("Não foi possível processar no tempo esperado para onboarding.");
      };

      // ============================================
      // Execute strategy based on parameter
      // ============================================
      switch (strategy) {
        case 'race':
          await tryWithRaceStrategy();
          break;
        case 'onboarding':
          await tryWithOnboardingStrategy();
          break;
        case 'cascade':
        default:
          await tryWithCascadingFallback();
          break;
      }
      
      console.log(`Strategy "${strategy}" completed with model: ${usedModel}`);

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
