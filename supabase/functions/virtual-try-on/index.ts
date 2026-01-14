import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Replicate from "https://esm.sh/replicate@0.25.2";

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
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { avatarImageUrl, garmentImageUrl, category, tryOnResultId, demoMode } = body;

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

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    console.log("Calling CatVTON-FLUX model...");
    console.log("Avatar URL:", avatarImageUrl);
    console.log("Garment URL:", garmentImageUrl);

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

    const getRetryAfterSeconds = (errorMsg: string): number | null => {
      // Replicate often returns: { ..., "retry_after": 8 }
      const match = errorMsg.match(/"retry_after"\s*:\s*(\d+)/i);
      if (!match) return null;
      const seconds = Number(match[1]);
      return Number.isFinite(seconds) ? seconds : null;
    };

    const sleepForRateLimit = async (errorMsg: string, fallbackSeconds = 8) => {
      const retryAfter = getRetryAfterSeconds(errorMsg) ?? fallbackSeconds;
      // add a small buffer so we don't re-hit the burst limit
      const waitMs = Math.max(1, retryAfter + 1) * 1000;
      console.log(`Rate limited, waiting ${waitMs}ms before retry...`);
      await sleep(waitMs);
    };

    // Primary model: IDM-VTON (CatVTON was discontinued)
    // IDM-VTON is now the main model for virtual try-on

    // Primary model: IDM-VTON
    const callIDMVTON = async (autoCrop: boolean, autoMask: boolean, attempt: number) => {
      console.log(`IDM-VTON attempt ${attempt}: auto_crop=${autoCrop}, auto_mask=${autoMask}`);
      
      return await replicate.run(
        "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
        {
          input: {
            human_img: avatarImageUrl,
            garm_img: garmentImageUrl,
            garment_des: category || "clothing",
            auto_mask: autoMask,
            auto_crop: autoCrop,
            denoise_steps: 30,
            seed: 42,
          },
        }
      );
    };

    // Nano Banana fallback (Lovable AI - no external API key needed)
    const callNanoBanana = async (): Promise<string | null> => {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        console.log("LOVABLE_API_KEY not configured, skipping Nano Banana fallback");
        return null;
      }

      console.log("Calling Nano Banana (Lovable AI) as fallback...");

      try {
        const response = await fetch(LOVABLE_AI_GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
      body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `You are a professional virtual try-on AI creating fashion photography.

Task: Place the garment from the SECOND image onto the person in the FIRST image.

CRITICAL REQUIREMENTS:
1. IMAGE ORIENTATION: Output MUST be VERTICAL/PORTRAIT orientation (taller than wide), matching the first image exactly
2. FULL BODY FRAMING: Include the COMPLETE person from HEAD to FEET - do NOT crop the head, face, or any body part
3. EXACT PROPORTIONS: Match the exact aspect ratio and dimensions of the first (person) image
4. Keep the person's face, hair, body shape, skin tone, and pose EXACTLY the same as the original
5. The garment should fit naturally on the person's body, replacing their current top/bottom
6. Maintain realistic lighting and shadows from the original photo
7. The result should look like a real professional fashion photograph

IMPORTANT: The output image must have the same vertical orientation as the input person image. Never rotate the image.

Output a single photorealistic image with the same dimensions and orientation as the first image.`,
                  },
                  {
                    type: "image_url",
                    image_url: { url: avatarImageUrl },
                  },
                  {
                    type: "image_url",
                    image_url: { url: garmentImageUrl },
                  },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Nano Banana error:", response.status, errorText);
          
          if (response.status === 429) {
            throw new Error("Nano Banana rate limit");
          }
          if (response.status === 402) {
            throw new Error("Lovable AI credits insuficientes");
          }
          throw new Error(`Nano Banana error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Nano Banana response:", JSON.stringify(data).slice(0, 500));

        // Extract image from response - check multiple possible formats
        const choice = data.choices?.[0];
        const message = choice?.message;
        
        // Format 1: images array
        const imageFromArray = message?.images?.[0]?.image_url?.url;
        if (imageFromArray) {
          console.log("Nano Banana returned image via images array");
          return imageFromArray;
        }

        // Format 2: content array with image_url
        if (Array.isArray(message?.content)) {
          for (const part of message.content) {
            if (part.type === "image_url" && part.image_url?.url) {
              console.log("Nano Banana returned image via content array");
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
              console.log("Nano Banana returned image via inline_data");
              return base64Url;
            }
          }
        }

        console.log("Nano Banana did not return an image in expected format");
        return null;
      } catch (error) {
        console.error("Nano Banana call failed:", error);
        throw error;
      }
    };

    try {
      let output: unknown;
      let usedModel = "IDM-VTON";

      // Primary: IDM-VTON with progressive fallback configurations
      try {
        output = await callIDMVTON(true, true, 1);
      } catch (firstError) {
        const firstErrorMsg = firstError instanceof Error ? firstError.message : String(firstError);
        console.log("IDM-VTON first attempt failed:", firstErrorMsg);
        
        // Check for rate limiting - wait and retry
        if (firstErrorMsg.includes("429") || firstErrorMsg.includes("Too Many Requests") || firstErrorMsg.includes("throttled")) {
          await sleepForRateLimit(firstErrorMsg);
          try {
            output = await callIDMVTON(true, true, 2);
          } catch (retryError) {
            const retryErrorMsg = retryError instanceof Error ? retryError.message : String(retryError);
            console.log("IDM-VTON retry after rate limit failed:", retryErrorMsg);
            // Try Nano Banana as fallback
            console.log("Trying Nano Banana as fallback after rate limit...");
            const nanoBananaResult = await callNanoBanana();
            if (nanoBananaResult) {
              output = nanoBananaResult;
              usedModel = "Nano Banana (Lovable AI)";
            } else {
              throw retryError;
            }
          }
        }
        // "list index out of range" - try with different auto_crop/auto_mask settings
        else if (firstErrorMsg.includes("list index out of range")) {
          console.log("IDM-VTON detection issue, trying with auto_crop=false...");
          await sleep(2000);
          try {
            output = await callIDMVTON(false, true, 2);
            usedModel = "IDM-VTON (fallback config)";
          } catch (secondError) {
            const secondErrorMsg = secondError instanceof Error ? secondError.message : String(secondError);
            if (secondErrorMsg.includes("list index out of range")) {
              console.log("IDM-VTON still failing, trying minimal config...");
              await sleep(2000);
              try {
                output = await callIDMVTON(false, false, 3);
                usedModel = "IDM-VTON (minimal config)";
              } catch (thirdError) {
                // All IDM-VTON attempts failed, try Nano Banana
                console.log("All IDM-VTON attempts failed, trying Nano Banana...");
                const nanoBananaResult = await callNanoBanana();
                if (nanoBananaResult) {
                  output = nanoBananaResult;
                  usedModel = "Nano Banana (Lovable AI)";
                } else {
                  throw thirdError;
                }
              }
            } else {
              // Different error, try Nano Banana
              console.log("IDM-VTON failed with different error, trying Nano Banana...");
              const nanoBananaResult = await callNanoBanana();
              if (nanoBananaResult) {
                output = nanoBananaResult;
                usedModel = "Nano Banana (Lovable AI)";
              } else {
                throw secondError;
              }
            }
          }
        } else {
          // Unknown error, try Nano Banana directly
          console.log("IDM-VTON failed with unknown error, trying Nano Banana...");
          const nanoBananaResult = await callNanoBanana();
          if (nanoBananaResult) {
            output = nanoBananaResult;
            usedModel = "Nano Banana (Lovable AI)";
          } else {
            throw firstError;
          }
        }
      }

      // If we still don't have output, try Nano Banana as last resort
      if (!output) {
        console.log("No output from IDM-VTON, trying Nano Banana...");
        const nanoBananaResult = await callNanoBanana();
        if (nanoBananaResult) {
          output = nanoBananaResult;
          usedModel = "Nano Banana (Lovable AI)";
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`${usedModel} completed in`, processingTime, "ms");
      console.log("Output:", output);

      // The output is the URL of the generated image
      const resultImageUrl = Array.isArray(output) ? output[0] : output;
      
      if (!resultImageUrl) {
        throw new Error("O modelo não retornou uma imagem. Verifique se a foto do avatar mostra uma pessoa de corpo inteiro.");
      }

      // Update the try_on_results record (skip for demo mode)
      if (tryOnResultId && !demoMode) {
        await supabase
          .from("try_on_results")
          .update({
            status: "completed",
            result_image_url: resultImageUrl,
            processing_time_ms: processingTime,
          })
          .eq("id", tryOnResultId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          resultImageUrl,
          processingTimeMs: processingTime,
          model: usedModel,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (modelError) {
      const processingTime = Date.now() - startTime;
      const errorMsg = modelError instanceof Error ? modelError.message : String(modelError);
      console.error("Virtual try-on model error:", errorMsg);
      
      // Provide user-friendly error messages
      let userMessage = "Falha ao processar prova virtual.";
      const isRateLimit = errorMsg.includes("429") || errorMsg.includes("Too Many Requests") || errorMsg.includes("throttled") || errorMsg.includes("rate limit");
      const retryAfterSeconds = isRateLimit ? (getRetryAfterSeconds(errorMsg) ?? 8) : null;

      // Try Nano Banana as emergency fallback for rate limits
      if (isRateLimit) {
        console.log("Rate limit hit, attempting Nano Banana as emergency fallback...");
        try {
          const nanoBananaResult = await callNanoBanana();
          if (nanoBananaResult) {
            console.log("Nano Banana emergency fallback succeeded!");
            
            // Update the try_on_results record with success (skip for demo mode)
            if (tryOnResultId && !demoMode) {
              await supabase
                .from("try_on_results")
                .update({
                  status: "completed",
                  result_image_url: nanoBananaResult,
                  processing_time_ms: Date.now() - startTime,
                })
                .eq("id", tryOnResultId);
            }

            return new Response(
              JSON.stringify({
                success: true,
                resultImageUrl: nanoBananaResult,
                processingTimeMs: Date.now() - startTime,
                model: "Nano Banana (Lovable AI - fallback)",
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (nanoBananaError) {
          console.error("Nano Banana emergency fallback failed:", nanoBananaError);
        }
      }

      if (errorMsg.includes("list index out of range") || errorMsg.includes("Failed to process")) {
        userMessage = "Não foi possível processar a imagem. Use uma foto de corpo inteiro com boa iluminação e fundo simples.";
      } else if (errorMsg.includes("Payment Required") || errorMsg.includes("402") || errorMsg.includes("credits insuficientes")) {
        userMessage = "Créditos insuficientes no serviço de IA. Tente novamente em alguns minutos.";
      } else if (isRateLimit) {
        userMessage = retryAfterSeconds
          ? `Limite de requisições atingido. Aguarde ~${retryAfterSeconds}s e tente novamente.`
          : "Limite de requisições atingido. Aguarde alguns segundos e tente novamente.";
      } else if (errorMsg.includes("imagem")) {
        userMessage = errorMsg; // Already a user-friendly message from validation
      }
      
      // Update status to failed (skip for demo mode)
      if (tryOnResultId && !demoMode) {
        await supabase
          .from("try_on_results")
          .update({ 
            status: "failed", 
            error_message: userMessage,
            processing_time_ms: processingTime 
          })
          .eq("id", tryOnResultId);
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: userMessage,
          retryAfterSeconds,
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
