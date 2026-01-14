import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ModelResult {
  model: string;
  status: "success" | "failed" | "skipped";
  resultImageUrl?: string;
  processingTimeMs?: number;
  cost: string;
  error?: string;
}

// Timeout for individual model processing (90 seconds)
const MODEL_TIMEOUT_MS = 90000;

// Retry configuration for rate limits
const RATE_LIMIT_RETRY_DELAY_MS = 12000; // 12 seconds
const MAX_RATE_LIMIT_RETRIES = 2;

// Helper to wait between polls
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Wrapper to add timeout to model calls
const withTimeout = <T>(promise: Promise<T>, ms: number, modelName: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: ${modelName} demorou mais de ${ms / 1000}s`));
    }, ms);
    
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// Wrapper for automatic retry on rate limits (Replicate)
const withRateLimitRetry = async <T>(
  fn: () => Promise<T>,
  modelName: string
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || String(error);
      
      // Check if it's a rate limit error
      const isRateLimit = errorMsg.includes('Rate limit') || 
                          errorMsg.includes('429') ||
                          errorMsg.includes('rate_limit');
      
      if (isRateLimit && attempt < MAX_RATE_LIMIT_RETRIES) {
        console.log(`[${modelName}] Rate limit hit, waiting ${RATE_LIMIT_RETRY_DELAY_MS / 1000}s before retry ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES}...`);
        await sleep(RATE_LIMIT_RETRY_DELAY_MS);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

// Get specialized prompt for Seedream models
const getSeedreamPrompt = (category: string): string => {
  const normalized = (category || "upper_body").toLowerCase();
  
  const categoryInstructions: Record<string, string> = {
    upper_body: "Replace ONLY the upper body clothing (shirt, blouse, jacket) on the person in Figure 1 with the garment shown in Figure 2.",
    lower_body: "Replace ONLY the lower body clothing (pants, skirt, shorts) on the person in Figure 1 with the garment shown in Figure 2.",
    dresses: "Replace the outfit on the person in Figure 1 with the dress/full garment shown in Figure 2."
  };

  const instruction = categoryInstructions[normalized] || categoryInstructions.upper_body;

  return `${instruction}

CRITICAL REQUIREMENTS:
- Preserve the EXACT face, hair, skin tone, and body shape from Figure 1
- Keep the EXACT same pose, arm positions, and hand gestures
- Maintain the original background completely unchanged
- Each hand must have exactly 5 fingers - do NOT modify hands
- The garment should drape naturally following body contours
- Output: Photorealistic fashion photo, 768x1024 pixels, portrait orientation

Figure 1: The person (preserve identity exactly)
Figure 2: The garment to apply`;
};

// Get prompt for Gemini model
const getGeminiPrompt = (category: string): string => {
  const normalized = (category || "upper_body").toLowerCase();
  const WIDTH = 768;
  const HEIGHT = 1024;

  let categoryInstruction = "Replace ONLY the clothing on the upper body/torso area";
  if (normalized === "lower_body") {
    categoryInstruction = "Replace ONLY the lower body clothing (pants, skirt, shorts)";
  } else if (normalized === "dresses") {
    categoryInstruction = "Replace the full outfit with the dress shown";
  }

  return `You are an expert virtual fashion photography AI.

TASK: Create a single image showing the person from image 1 wearing the garment from image 2.

===== MANDATORY OUTPUT SPECIFICATIONS =====
OUTPUT DIMENSIONS: Exactly ${WIDTH} pixels wide by ${HEIGHT} pixels tall
ASPECT RATIO: Exactly 3:4 portrait (0.75)
ORIENTATION: Vertical/Portrait ONLY

===== GARMENT APPLICATION =====
${categoryInstruction}
- The garment should drape naturally following the body's contours
- Add natural fabric shadows and wrinkles
- Maintain realistic lighting matching the original photo

===== IDENTITY PRESERVATION (NON-NEGOTIABLE) =====
These must be PIXEL-PERFECT identical to input:
- Face features, expression, skin tone
- Hair color, hairstyle, hair position
- Body shape, weight, curves, proportions
- Pose (exact arm and leg positions)
- Hand positions and gestures (EXACTLY 5 fingers per hand)
- Background (keep EXACTLY the same)

===== FINAL OUTPUT =====
- One single photorealistic image
- Dimensions: ${WIDTH}x${HEIGHT} pixels exactly
- Full body visible (head to at least mid-thigh)
- Fashion editorial quality
- No text, watermarks, or artifacts`;
};

// Helper to get latest model version from Replicate
const getReplicateLatestVersion = async (
  modelOwnerAndName: string,
  replicateApiKey: string
): Promise<string | null> => {
  try {
    console.log(`[Replicate] Fetching latest version for ${modelOwnerAndName}...`);
    const response = await fetch(
      `https://api.replicate.com/v1/models/${modelOwnerAndName}`,
      {
        headers: { "Authorization": `Token ${replicateApiKey}` }
      }
    );
    
    if (!response.ok) {
      console.error(`[Replicate] Failed to get model info: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const version = data.latest_version?.id;
    console.log(`[Replicate] Resolved version: ${version?.substring(0, 12)}...`);
    return version || null;
  } catch (error) {
    console.error(`[Replicate] Error fetching model version:`, error);
    return null;
  }
};

// ============================================
// Seedream 4.5 via Replicate
// ============================================
const callSeedream45 = async (
  avatarUrl: string,
  garmentUrl: string,
  category: string,
  replicateApiKey: string
): Promise<ModelResult> => {
  const startTime = Date.now();
  const model = "seedream-4.5";

  try {
    console.log(`[${model}] Starting...`);

    // Get latest version dynamically
    const version = await getReplicateLatestVersion("bytedance/seedream-4.5", replicateApiKey);
    if (!version) {
      throw new Error("Could not resolve model version");
    }

    const prompt = getSeedreamPrompt(category);

    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: version,
        input: {
          prompt: prompt,
          image_input: [avatarUrl, garmentUrl],
          size: "custom",
          width: 1920,
          height: 2560,
          aspect_ratio: "3:4",
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`[${model}] Create error:`, createResponse.status, errorText);
      
      if (createResponse.status === 429) {
        throw new Error("Rate limit exceeded");
      }
      if (createResponse.status === 402) {
        throw new Error("Replicate credits exhausted");
      }
      throw new Error(`API error: ${createResponse.status}`);
    }

    const prediction = await createResponse.json();
    console.log(`[${model}] Prediction created:`, prediction.id);

    // Poll for result (max 2 minutes)
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(2000);

      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: { "Authorization": `Token ${replicateApiKey}` },
        }
      );

      if (!statusResponse.ok) continue;

      const status = await statusResponse.json();
      console.log(`[${model}] Status (${i + 1}/${maxAttempts}):`, status.status);

      if (status.status === "succeeded") {
        let outputUrl = status.output;
        if (Array.isArray(status.output)) {
          outputUrl = status.output[0];
        }

        if (outputUrl && typeof outputUrl === "string") {
          return {
            model,
            status: "success",
            resultImageUrl: outputUrl,
            processingTimeMs: Date.now() - startTime,
            cost: "$0.04",
          };
        }
        throw new Error("No valid output URL");
      }

      if (status.status === "failed") {
        throw new Error(status.error || "Processing failed");
      }

      if (status.status === "canceled") {
        throw new Error("Canceled");
      }
    }

    throw new Error("Timeout after 2 minutes");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${model}] Failed:`, errorMsg);
    return {
      model,
      status: "failed",
      processingTimeMs: Date.now() - startTime,
      cost: "$0.00",
      error: errorMsg,
    };
  }
};

// ============================================
// Seedream 4.0 via Replicate
// ============================================
const callSeedream40 = async (
  avatarUrl: string,
  garmentUrl: string,
  category: string,
  replicateApiKey: string
): Promise<ModelResult> => {
  const startTime = Date.now();
  const model = "seedream-4.0";

  try {
    console.log(`[${model}] Starting...`);

    // Get latest version dynamically
    const version = await getReplicateLatestVersion("bytedance/seedream-4", replicateApiKey);
    if (!version) {
      throw new Error("Could not resolve model version");
    }

    const prompt = getSeedreamPrompt(category);

    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: version,
        input: {
          prompt: prompt,
          image_input: [avatarUrl, garmentUrl],
          size: "custom",
          width: 1920,
          height: 2560,
          aspect_ratio: "3:4",
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`[${model}] Create error:`, createResponse.status, errorText);
      
      if (createResponse.status === 429) {
        throw new Error("Rate limit exceeded");
      }
      if (createResponse.status === 402) {
        throw new Error("Replicate credits exhausted");
      }
      throw new Error(`API error: ${createResponse.status}`);
    }

    const prediction = await createResponse.json();
    console.log(`[${model}] Prediction created:`, prediction.id);

    // Poll for result (max 2 minutes)
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(2000);

      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: { "Authorization": `Token ${replicateApiKey}` },
        }
      );

      if (!statusResponse.ok) continue;

      const status = await statusResponse.json();
      console.log(`[${model}] Status (${i + 1}/${maxAttempts}):`, status.status);

      if (status.status === "succeeded") {
        let outputUrl = status.output;
        if (Array.isArray(status.output)) {
          outputUrl = status.output[0];
        }

        if (outputUrl && typeof outputUrl === "string") {
          return {
            model,
            status: "success",
            resultImageUrl: outputUrl,
            processingTimeMs: Date.now() - startTime,
            cost: "$0.03",
          };
        }
        throw new Error("No valid output URL");
      }

      if (status.status === "failed") {
        throw new Error(status.error || "Processing failed");
      }

      if (status.status === "canceled") {
        throw new Error("Canceled");
      }
    }

    throw new Error("Timeout after 2 minutes");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${model}] Failed:`, errorMsg);
    return {
      model,
      status: "failed",
      processingTimeMs: Date.now() - startTime,
      cost: "$0.00",
      error: errorMsg,
    };
  }
};

// ============================================
// Gemini 3 Pro Image Preview via Lovable AI
// ============================================
const callGemini = async (
  avatarUrl: string,
  garmentUrl: string,
  category: string,
  lovableApiKey: string
): Promise<ModelResult> => {
  const startTime = Date.now();
  const model = "gemini-3-pro-image-preview";

  try {
    console.log(`[${model}] Starting...`);

    const prompt = getGeminiPrompt(category);

    const response = await fetch(LOVABLE_AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: avatarUrl } },
              { type: "image_url", image_url: { url: garmentUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${model}] Error:`, response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[${model}] Response received`);

    // Extract image from response
    const extractedUrl = extractImageFromResponse(data);
    
    if (extractedUrl) {
      return {
        model,
        status: "success",
        resultImageUrl: extractedUrl,
        processingTimeMs: Date.now() - startTime,
        cost: "$0.00 (included)",
      };
    }

    throw new Error("No image in response");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${model}] Failed:`, errorMsg);
    return {
      model,
      status: "failed",
      processingTimeMs: Date.now() - startTime,
      cost: "$0.00",
      error: errorMsg,
    };
  }
};

// Helper to extract image from Lovable AI response
const extractImageFromResponse = (data: any): string | null => {
  const choice = data.choices?.[0];
  const message = choice?.message;

  // Format 1: images array
  const imageFromArray = message?.images?.[0]?.image_url?.url;
  if (imageFromArray) return imageFromArray;

  // Format 2: content array with image_url
  if (Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (part.type === "image_url" && part.image_url?.url) {
        return part.image_url.url;
      }
    }
  }

  // Format 3: inline_data in content
  if (Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (part.type === "image" && part.inline_data?.data) {
        const mimeType = part.inline_data.mime_type || "image/png";
        return `data:${mimeType};base64,${part.inline_data.data}`;
      }
    }
  }

  return null;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      avatarImageUrl, 
      garmentImageUrl, 
      category = "upper_body",
      models: requestedModels 
    } = body;

    console.log("=== VTO Model Benchmark ===");
    console.log("Category:", category);
    console.log("Requested models:", requestedModels || "all");

    if (!avatarImageUrl || !garmentImageUrl) {
      return new Response(
        JSON.stringify({ error: "avatarImageUrl and garmentImageUrl are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const allModels = ["seedream-4.5", "seedream-4.0", "gemini"];
    const modelsToRun = requestedModels || allModels;

    console.log("Running models:", modelsToRun);
    const totalStartTime = Date.now();

    // Build promises for each requested model
    const promises: Promise<ModelResult>[] = [];

    for (const modelName of modelsToRun) {
      switch (modelName) {
        case "seedream-4.5":
          if (REPLICATE_API_KEY) {
            // Wrap with timeout AND retry logic for rate limits
            promises.push(
              withTimeout(
                withRateLimitRetry(
                  () => callSeedream45(avatarImageUrl, garmentImageUrl, category, REPLICATE_API_KEY),
                  "Seedream 4.5"
                ),
                MODEL_TIMEOUT_MS + (MAX_RATE_LIMIT_RETRIES * RATE_LIMIT_RETRY_DELAY_MS),
                "Seedream 4.5"
              ).catch(err => ({
                model: "seedream-4.5",
                status: "failed" as const,
                cost: "$0.00",
                error: err.message,
              }))
            );
          } else {
            promises.push(Promise.resolve({
              model: "seedream-4.5",
              status: "skipped" as const,
              cost: "$0.00",
              error: "REPLICATE_API_KEY not configured",
            }));
          }
          break;
        case "seedream-4.0":
          if (REPLICATE_API_KEY) {
            // Wrap with timeout AND retry logic for rate limits
            promises.push(
              withTimeout(
                withRateLimitRetry(
                  () => callSeedream40(avatarImageUrl, garmentImageUrl, category, REPLICATE_API_KEY),
                  "Seedream 4.0"
                ),
                MODEL_TIMEOUT_MS + (MAX_RATE_LIMIT_RETRIES * RATE_LIMIT_RETRY_DELAY_MS),
                "Seedream 4.0"
              ).catch(err => ({
                model: "seedream-4.0",
                status: "failed" as const,
                cost: "$0.00",
                error: err.message,
              }))
            );
          } else {
            promises.push(Promise.resolve({
              model: "seedream-4.0",
              status: "skipped" as const,
              cost: "$0.00",
              error: "REPLICATE_API_KEY not configured",
            }));
          }
          break;
        case "gemini":
          if (LOVABLE_API_KEY) {
            promises.push(
              withTimeout(
                callGemini(avatarImageUrl, garmentImageUrl, category, LOVABLE_API_KEY),
                MODEL_TIMEOUT_MS,
                "Gemini 3 Pro"
              ).catch(err => ({
                model: "gemini-3-pro-image-preview",
                status: "failed" as const,
                cost: "$0.00",
                error: err.message,
              }))
            );
          } else {
            promises.push(Promise.resolve({
              model: "gemini-3-pro-image-preview",
              status: "skipped" as const,
              cost: "$0.00",
              error: "LOVABLE_API_KEY not configured",
            }));
          }
          break;
        default:
          console.log(`Unknown model: ${modelName}, skipping`);
      }
    }

    // Run all models in parallel with individual timeouts
    const results = await Promise.all(promises);

    const totalTimeMs = Date.now() - totalStartTime;

    // Calculate summary stats
    const successCount = results.filter(r => r.status === "success").length;
    const failedCount = results.filter(r => r.status === "failed").length;
    const skippedCount = results.filter(r => r.status === "skipped").length;

    // Find fastest successful model
    const successfulResults = results.filter(r => r.status === "success" && r.processingTimeMs);
    const fastestModel = successfulResults.length > 0 
      ? successfulResults.reduce((a, b) => (a.processingTimeMs! < b.processingTimeMs! ? a : b)).model
      : null;

    console.log("=== Benchmark Complete ===");
    console.log(`Total time: ${totalTimeMs}ms`);
    console.log(`Success: ${successCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);
    console.log(`Fastest: ${fastestModel || "N/A"}`);

    return new Response(
      JSON.stringify({
        success: true,
        category,
        totalTimeMs,
        summary: {
          success: successCount,
          failed: failedCount,
          skipped: skippedCount,
          fastestModel,
        },
        results: results.map(r => ({
          model: r.model,
          status: r.status,
          resultImageUrl: r.resultImageUrl,
          processingTimeMs: r.processingTimeMs,
          cost: r.cost,
          error: r.error,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Benchmark error:", error);
    const errorMessage = error instanceof Error ? error.message : "Benchmark failed";

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
