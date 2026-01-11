import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    const { avatarImageUrl, garmentImageUrl, category, tryOnResultId } = body;

    console.log("Virtual Try-On request:", {
      userId: user.id,
      category,
      tryOnResultId,
      hasAvatar: !!avatarImageUrl,
      hasGarment: !!garmentImageUrl,
    });

    if (!avatarImageUrl || !garmentImageUrl) {
      return new Response(
        JSON.stringify({ error: "Avatar image and garment image are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Update status to processing
    if (tryOnResultId) {
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
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Primary model: CatVTON-FLUX (more robust, faster)
    const callCatVTON = async (attempt: number, seed: number = 42) => {
      console.log(`CatVTON-FLUX attempt ${attempt}, seed=${seed}`);
      
      return await replicate.run(
        "mmezhov/catvton-flux",
        {
          input: {
            image: avatarImageUrl,      // Person image
            garment: garmentImageUrl,   // Garment image
            num_inference_steps: 30,
            seed: seed,
            guidance_scale: 30,
          },
        }
      );
    };

    // Fallback model: IDM-VTON (if CatVTON fails)
    const callIDMVTON = async (autoCrop: boolean, autoMask: boolean, attempt: number) => {
      console.log(`IDM-VTON fallback attempt ${attempt}: auto_crop=${autoCrop}, auto_mask=${autoMask}`);
      
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

    try {
      let output: unknown;
      let usedModel = "CatVTON-FLUX";

      // Attempt 1: CatVTON-FLUX (primary - more robust)
      try {
        output = await callCatVTON(1);
      } catch (firstError) {
        const firstErrorMsg = firstError instanceof Error ? firstError.message : String(firstError);
        console.log("CatVTON-FLUX first attempt failed:", firstErrorMsg);
        
        // Check for rate limiting - wait and retry
        if (firstErrorMsg.includes("429") || firstErrorMsg.includes("Too Many Requests") || firstErrorMsg.includes("throttled")) {
          console.log("Rate limited, waiting 5 seconds before retry...");
          await sleep(5000);
          try {
            output = await callCatVTON(2, 123);
          } catch (retryError) {
            const retryErrorMsg = retryError instanceof Error ? retryError.message : String(retryError);
            console.log("CatVTON-FLUX retry failed:", retryErrorMsg);
            throw retryError;
          }
        }
        // Try with different seed if image processing issue
        else if (firstErrorMsg.includes("index") || firstErrorMsg.includes("processing") || firstErrorMsg.includes("Failed")) {
          console.log("CatVTON-FLUX processing issue, trying with different seed...");
          await sleep(2000);
          try {
            output = await callCatVTON(2, 123);
          } catch (secondError) {
            const secondErrorMsg = secondError instanceof Error ? secondError.message : String(secondError);
            console.log("CatVTON-FLUX second attempt failed, falling back to IDM-VTON:", secondErrorMsg);
            
            // Fallback to IDM-VTON
            await sleep(2000);
            try {
              output = await callIDMVTON(true, true, 1);
              usedModel = "IDM-VTON";
            } catch (idmError) {
              const idmErrorMsg = idmError instanceof Error ? idmError.message : String(idmError);
              console.log("IDM-VTON first attempt failed:", idmErrorMsg);
              
              if (idmErrorMsg.includes("list index out of range")) {
                await sleep(2000);
                try {
                  output = await callIDMVTON(false, true, 2);
                  usedModel = "IDM-VTON (fallback config)";
                } catch (idmError2) {
                  const idmErrorMsg2 = idmError2 instanceof Error ? idmError2.message : String(idmError2);
                  if (idmErrorMsg2.includes("list index out of range")) {
                    await sleep(2000);
                    output = await callIDMVTON(false, false, 3);
                    usedModel = "IDM-VTON (minimal config)";
                  } else {
                    throw idmError2;
                  }
                }
              } else {
                throw idmError;
              }
            }
          }
        } else {
          // Unknown error, try IDM-VTON as fallback
          console.log("Unknown CatVTON error, falling back to IDM-VTON...");
          await sleep(2000);
          try {
            output = await callIDMVTON(true, true, 1);
            usedModel = "IDM-VTON";
          } catch (idmError) {
            throw idmError;
          }
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

      // Update the try_on_results record
      if (tryOnResultId) {
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
      if (errorMsg.includes("list index out of range") || errorMsg.includes("Failed to process")) {
        userMessage = "Não foi possível processar a imagem. Use uma foto de corpo inteiro com boa iluminação e fundo simples.";
      } else if (errorMsg.includes("Payment Required") || errorMsg.includes("402")) {
        userMessage = "Créditos insuficientes no serviço de IA. Tente novamente em alguns minutos.";
      } else if (errorMsg.includes("429") || errorMsg.includes("Too Many Requests") || errorMsg.includes("throttled")) {
        userMessage = "Limite de requisições atingido. Aguarde alguns segundos e tente novamente.";
      } else if (errorMsg.includes("imagem")) {
        userMessage = errorMsg; // Already a user-friendly message from validation
      }
      
      // Update status to failed
      if (tryOnResultId) {
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
        JSON.stringify({ success: false, error: userMessage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
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
