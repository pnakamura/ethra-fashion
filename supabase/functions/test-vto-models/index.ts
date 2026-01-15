import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ModelResult {
  model: string;
  status: "success" | "failed" | "skipped" | "processing";
  resultImageUrl?: string;
  processingTimeMs?: number;
  cost: string;
  error?: string;
  requestId?: string; // For async jobs (FAL.AI)
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

// Get prompt for Gemini model - ENHANCED ANTI-DISTORTION VERSION
const getGeminiPrompt = (category: string): string => {
  const normalized = (category || "upper_body").toLowerCase();
  const WIDTH = 768;
  const HEIGHT = 1024;

  let categoryInstruction = "Replace ONLY the clothing on the upper body/torso area (shirt, blouse, jacket, sweater)";
  if (normalized === "lower_body") {
    categoryInstruction = "Replace ONLY the lower body clothing (pants, skirt, shorts, jeans)";
  } else if (normalized === "dresses") {
    categoryInstruction = "Replace the full outfit with the dress/full garment shown";
  }

  return `You are an elite virtual try-on AI specializing in photorealistic fashion imaging.

TASK: Create ONE image showing the person from IMAGE 1 wearing the garment from IMAGE 2.

===== MANDATORY OUTPUT SPECIFICATIONS =====
OUTPUT DIMENSIONS: Exactly ${WIDTH}x${HEIGHT} pixels
ASPECT RATIO: 3:4 portrait (0.75) - VERTICAL ONLY
ORIENTATION: Portrait/Vertical - NEVER landscape

===== GARMENT APPLICATION =====
${categoryInstruction}
- Drape the garment naturally following body contours
- Add realistic fabric shadows, wrinkles, and folds
- Match lighting direction and intensity from original photo
- Preserve garment colors, patterns, and textures exactly as shown

===== ABSOLUTE BODY PROPORTION RULES (CRITICAL) =====
DO NOT modify ANY body proportions:
- Keep EXACT head-to-body ratio
- Preserve EXACT shoulder width
- Maintain EXACT torso length and width
- Keep EXACT waist-to-hip ratio
- Preserve EXACT arm and leg proportions
- DO NOT widen, narrow, elongate, or compress ANY body part
- The person must look IDENTICAL in build to the original

===== ANATOMICAL ACCURACY - HANDS (CRITICAL) =====
Hands are extremely important - follow these rules:
- Each hand MUST have exactly 5 fingers
- Preserve EXACT hand positions from original
- Keep natural finger spacing and proportions
- DO NOT add, remove, merge, or distort fingers
- DO NOT change hand poses or gestures
- If hands are visible, they must look NATURAL and REALISTIC

===== IDENTITY PRESERVATION (NON-NEGOTIABLE) =====
These must be PIXEL-PERFECT identical to input:
- Face: exact features, expression, skin tone, makeup
- Hair: color, style, position, texture
- Body: shape, weight, curves, silhouette
- Pose: exact arm/leg positions, body angle
- Background: keep 100% unchanged

===== WHAT YOU MUST NOT DO =====
- DO NOT warp, stretch, or compress the body
- DO NOT change facial features or expression
- DO NOT modify hair color or style
- DO NOT add extra fingers or merge fingers
- DO NOT change the background
- DO NOT add watermarks, text, or logos
- DO NOT create multiple people or split images
- DO NOT generate landscape orientation

===== FINAL OUTPUT =====
- ONE single photorealistic image
- Dimensions: ${WIDTH}x${HEIGHT} pixels exactly
- Full body visible: head to at least mid-thigh
- Fashion editorial quality, magazine-ready
- Natural, believable result - like a real photo`;
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
// Leffa via FAL.AI (Commercial VTO)
// ============================================
const callLeffa = async (
  avatarUrl: string,
  garmentUrl: string,
  category: string,
  falApiKey: string
): Promise<ModelResult> => {
  const startTime = Date.now();
  const model = "leffa";

  try {
    console.log(`[${model}] Starting...`);

    // Map category to Leffa format
    const mapCategory = (cat: string): string => {
      const normalized = (cat || "").toLowerCase();
      if (["top", "upper_body", "shirt", "blouse", "jacket"].includes(normalized)) 
        return "upper_body";
      if (["bottom", "lower_body", "pants", "skirt", "shorts"].includes(normalized)) 
        return "lower_body";
      if (["dress", "dresses", "full_body", "full"].includes(normalized)) 
        return "dresses";
      return "upper_body";
    };

    const leffaCategory = mapCategory(category);
    console.log(`[${model}] Category mapped: ${category} -> ${leffaCategory}`);

    // Submit request to FAL.AI queue
    const submitResponse = await fetch(
      "https://queue.fal.run/fal-ai/leffa/virtual-tryon",
      {
        method: "POST",
        headers: {
          "Authorization": `Key ${falApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          human_image_url: avatarUrl,
          garment_image_url: garmentUrl,
          garment_type: leffaCategory,
        }),
      }
    );

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`[${model}] Submit error:`, submitResponse.status, errorText);
      
      if (submitResponse.status === 401) {
        throw new Error("FAL API key invalid");
      }
      if (submitResponse.status === 429) {
        throw new Error("Rate limit exceeded");
      }
      throw new Error(`API error: ${submitResponse.status}`);
    }

    const queueData = await submitResponse.json();
    const requestId = queueData.request_id;
    console.log(`[${model}] Request queued:`, requestId);

    // Poll for result (max 40 seconds to stay within Edge Function limits)
    // NOTE: Status/result URLs use base model path WITHOUT /virtual-tryon subpath
    const maxAttempts = 20; // 20 x 2s = 40s (safe margin for 50-60s limit)
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(2000);

      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/leffa/requests/${requestId}/status`,
        {
          headers: { "Authorization": `Key ${falApiKey}` },
        }
      );

      if (!statusResponse.ok) continue;

      const status = await statusResponse.json();
      console.log(`[${model}] Status (${i + 1}/${maxAttempts}):`, status.status);

      if (status.status === "COMPLETED") {
        // Fetch result - use base model path
        const resultResponse = await fetch(
          `https://queue.fal.run/fal-ai/leffa/requests/${requestId}`,
          {
            headers: { "Authorization": `Key ${falApiKey}` },
          }
        );
        
        const result = await resultResponse.json();
        const outputUrl = result.image?.url;

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

      if (status.status === "FAILED") {
        throw new Error(status.error || "Processing failed");
      }
    }

    // If not completed within 40s, return "processing" status with requestId for manual check
    console.log(`[${model}] Still processing after 40s, returning async status with requestId: ${requestId}`);
    return {
      model,
      status: "processing",
      processingTimeMs: Date.now() - startTime,
      cost: "$0.03",
      requestId: requestId,
      error: "Ainda processando - clique para verificar o resultado",
    };
  } catch (error: any) {
    console.error(`[${model}] Error:`, error.message);
    return {
      model,
      status: "failed",
      processingTimeMs: Date.now() - startTime,
      cost: "$0.00",
      error: error.message,
    };
  }
};

// ============================================
// IDM-VTON via Replicate (Specialized VTO)
// ============================================

// Wrapper with retry for intermittent "list index out of range" errors
const callIDMVTONWithRetry = async (
  avatarUrl: string,
  garmentUrl: string,
  category: string,
  apiKey: string,
  maxRetries: number = 2
): Promise<ModelResult> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await callIDMVTON(avatarUrl, garmentUrl, category, apiKey);
      
      // Check for "list index out of range" error - retry if found
      if (result.status === 'failed' && result.error?.includes('list index out of range')) {
        console.warn(`[idm-vton] Attempt ${attempt + 1}/${maxRetries + 1} failed with index error`);
        if (attempt < maxRetries) {
          console.log(`[idm-vton] Retrying in 3s...`);
          await sleep(3000);
          continue;
        }
      }
      
      return result;
    } catch (err: any) {
      console.error(`[idm-vton] Attempt ${attempt + 1} error:`, err.message);
      if (attempt === maxRetries) {
        return { model: 'idm-vton', status: 'failed', cost: '$0.00', error: err.message };
      }
      await sleep(3000);
    }
  }
  
  return { model: 'idm-vton', status: 'failed', cost: '$0.00', error: 'Max retries exceeded' };
};

const callIDMVTON = async (
  avatarUrl: string,
  garmentUrl: string,
  category: string,
  replicateApiKey: string
): Promise<ModelResult> => {
  const startTime = Date.now();
  const model = "idm-vton";

  try {
    console.log(`[${model}] Starting...`);

    // Get latest version dynamically
    const version = await getReplicateLatestVersion("cuuupid/idm-vton", replicateApiKey);
    if (!version) {
      throw new Error("Could not resolve model version");
    }

    // Map category to IDM-VTON expected format
    const mapCategory = (cat: string): string => {
      const normalized = (cat || "").toLowerCase();
      if (["top", "upper_body", "shirt", "blouse", "jacket"].includes(normalized)) return "upper_body";
      if (["bottom", "lower_body", "pants", "skirt", "shorts"].includes(normalized)) return "lower_body";
      if (["dress", "dresses", "full_body", "full"].includes(normalized)) return "dresses";
      return "upper_body";
    };

    const idmCategory = mapCategory(category);
    console.log(`[${model}] Category mapped: ${category} -> ${idmCategory}`);

    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version,
        input: {
          garm_img: garmentUrl,
          human_img: avatarUrl,
          category: idmCategory,
          garment_des: "A fashion garment, focus on natural fabric drape and realistic fit",
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
            cost: "$0.05",
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
// Vertex AI Virtual Try-On via Google Cloud
// ============================================
const callVertexAI = async (
  avatarUrl: string,
  garmentUrl: string,
  category: string
): Promise<ModelResult> => {
  const startTime = Date.now();
  const model = "vertex-ai";

  try {
    console.log(`[${model}] Starting...`);

    const credentialsJson = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");
    if (!credentialsJson) {
      throw new Error("Credentials not configured");
    }

    // Call the vertex-try-on edge function
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/vertex-try-on`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          avatarImageUrl: avatarUrl,
          garmentImageUrl: garmentUrl,
          category,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${model}] Error:`, response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded");
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.resultImageUrl) {
      return {
        model,
        status: "success",
        resultImageUrl: data.resultImageUrl,
        processingTimeMs: Date.now() - startTime,
        cost: "$0.02",
      };
    }

    throw new Error(data.error || "No image generated");
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
  const model = "gemini";

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

    // Extract image from response with enhanced logging
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

// Helper to extract image from Lovable AI response with detailed logging
const extractImageFromResponse = (data: any): string | null => {
  console.log("[Gemini] Full response structure:", JSON.stringify(data).substring(0, 1500));
  
  const choice = data.choices?.[0];
  const message = choice?.message;
  
  console.log("[Gemini] Message keys:", message ? Object.keys(message) : "no message");
  console.log("[Gemini] Message content type:", typeof message?.content);

  // Format 1: images array
  const imageFromArray = message?.images?.[0]?.image_url?.url;
  if (imageFromArray) {
    console.log("[Gemini] Found image via images array");
    return imageFromArray;
  }

  // Format 2: content array with image_url
  if (Array.isArray(message?.content)) {
    console.log("[Gemini] Content array length:", message.content.length);
    for (const part of message.content) {
      console.log("[Gemini] Part type:", part.type, "keys:", Object.keys(part));
      
      if (part.type === "image_url" && part.image_url?.url) {
        console.log("[Gemini] Found via content image_url type");
        return part.image_url.url;
      }
      
      // Format: Direct image_url in part
      if (part.image_url?.url) {
        console.log("[Gemini] Found via direct part.image_url");
        return part.image_url.url;
      }
    }
  }

  // Format 3: inline_data in content
  if (Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (part.type === "image" && part.inline_data?.data) {
        console.log("[Gemini] Found via inline_data");
        const mimeType = part.inline_data.mime_type || "image/png";
        return `data:${mimeType};base64,${part.inline_data.data}`;
      }
      
      // Format: Direct data in part
      if (part.data && typeof part.data === "string" && part.data.length > 100) {
        console.log("[Gemini] Found via direct part.data (base64)");
        return `data:image/png;base64,${part.data}`;
      }
    }
  }

  // Format 4: Check if content is a string (sometimes the whole response is base64)
  if (typeof message?.content === "string" && message.content.startsWith("data:image")) {
    console.log("[Gemini] Found via string content (data URL)");
    return message.content;
  }

  console.log("[Gemini] No image found in any format");
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
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");

    // Include all models in the default list
    const allModels = ["idm-vton", "leffa", "seedream-4.5", "seedream-4.0", "vertex-ai", "gemini"];
    const modelsToRun = requestedModels || allModels;

    console.log("Running models:", modelsToRun);
    const totalStartTime = Date.now();

    // Separate models by provider to handle rate limits
    const replicateModels = modelsToRun.filter((m: string) => 
      ['idm-vton', 'seedream-4.5', 'seedream-4.0'].includes(m)
    );
    const falModels = modelsToRun.filter((m: string) => 
      ['leffa'].includes(m)
    );
    const googleModels = modelsToRun.filter((m: string) => 
      ['vertex-ai', 'gemini'].includes(m)
    );

    console.log("=== Execution Strategy (Optimized Order) ===");
    console.log("1. FAL.AI models FIRST (needs more time):", falModels);
    console.log("2. Google models:", googleModels);
    console.log("3. Replicate models (sequential with 12s delay):", replicateModels);

    const allResults: ModelResult[] = [];

    // ============================================
    // STEP 1: Execute FAL.AI models FIRST (needs more time)
    // Run these first to ensure they complete before function timeout
    // ============================================
    const FAL_DELAY_MS = 5000;
    
    for (let i = 0; i < falModels.length; i++) {
      const modelName = falModels[i];
      
      if (i > 0) {
        console.log(`[FAL.AI] Waiting ${FAL_DELAY_MS / 1000}s before ${modelName}...`);
        await sleep(FAL_DELAY_MS);
      }
      
      console.log(`[FAL.AI] Starting ${modelName} (${i + 1}/${falModels.length})...`);
      let result: ModelResult;
      
      try {
        switch (modelName) {
          case "leffa":
            if (FAL_API_KEY) {
              result = await withTimeout(
                callLeffa(avatarImageUrl, garmentImageUrl, category, FAL_API_KEY),
                MODEL_TIMEOUT_MS * 2, // 3 minutes for Leffa
                "Leffa"
              );
            } else {
              result = { model: "leffa", status: "skipped", cost: "$0.00", error: "FAL_API_KEY not configured" };
            }
            break;
          default:
            result = { model: modelName, status: "skipped", cost: "$0.00", error: "Unknown FAL.AI model" };
        }
      } catch (err: any) {
        result = { model: modelName, status: "failed", cost: "$0.00", error: err.message };
      }
      
      allResults.push(result);
      console.log(`[FAL.AI] ${modelName} completed: ${result.status} (${result.processingTimeMs || 0}ms)`);
    }

    // ============================================
    // STEP 2: Execute Google models
    // 5 seconds delay to avoid rate limits
    // ============================================
    const GOOGLE_DELAY_MS = 5000;
    
    for (let i = 0; i < googleModels.length; i++) {
      const modelName = googleModels[i];
      
      if (i > 0 || falModels.length > 0) {
        console.log(`[Google] Waiting ${GOOGLE_DELAY_MS / 1000}s before ${modelName}...`);
        await sleep(GOOGLE_DELAY_MS);
      }
      
      console.log(`[Google] Starting ${modelName} (${i + 1}/${googleModels.length})...`);
      let result: ModelResult;
      
      try {
        switch (modelName) {
          case "vertex-ai":
            const vertexCredentials = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");
            if (vertexCredentials) {
              result = await withTimeout(
                callVertexAI(avatarImageUrl, garmentImageUrl, category),
                MODEL_TIMEOUT_MS,
                "Vertex AI"
              );
            } else {
              result = { model: "vertex-ai", status: "skipped", cost: "$0.00", error: "GOOGLE_APPLICATION_CREDENTIALS_JSON not configured" };
            }
            break;
          case "gemini":
            if (LOVABLE_API_KEY) {
              result = await withTimeout(
                callGemini(avatarImageUrl, garmentImageUrl, category, LOVABLE_API_KEY),
                MODEL_TIMEOUT_MS,
                "Gemini 3 Pro"
              );
            } else {
              result = { model: "gemini", status: "skipped", cost: "$0.00", error: "LOVABLE_API_KEY not configured" };
            }
            break;
          default:
            result = { model: modelName, status: "skipped", cost: "$0.00", error: "Unknown Google model" };
        }
      } catch (err: any) {
        result = { model: modelName, status: "failed", cost: "$0.00", error: err.message };
      }
      
      allResults.push(result);
      console.log(`[Google] ${modelName} completed: ${result.status} (${result.processingTimeMs || 0}ms)`);
    }

    // ============================================
    // STEP 3: Execute Replicate models SEQUENTIALLY
    // 12 seconds delay to avoid rate limits
    // ============================================
    const REPLICATE_DELAY_MS = 12000;
    
    for (let i = 0; i < replicateModels.length; i++) {
      const modelName = replicateModels[i];
      
      if (i > 0 || falModels.length > 0 || googleModels.length > 0) {
        console.log(`[Replicate] Waiting ${REPLICATE_DELAY_MS / 1000}s before ${modelName}...`);
        await sleep(REPLICATE_DELAY_MS);
      }
      
      console.log(`[Replicate] Starting ${modelName} (${i + 1}/${replicateModels.length})...`);
      let result: ModelResult;
      
      try {
        switch (modelName) {
          case "idm-vton":
            if (REPLICATE_API_KEY) {
              result = await withTimeout(
                withRateLimitRetry(
                  () => callIDMVTONWithRetry(avatarImageUrl, garmentImageUrl, category, REPLICATE_API_KEY),
                  "IDM-VTON"
                ),
                MODEL_TIMEOUT_MS + (MAX_RATE_LIMIT_RETRIES * RATE_LIMIT_RETRY_DELAY_MS) + 10000,
                "IDM-VTON"
              );
            } else {
              result = { model: "idm-vton", status: "skipped", cost: "$0.00", error: "REPLICATE_API_KEY not configured" };
            }
            break;
          case "seedream-4.5":
            if (REPLICATE_API_KEY) {
              result = await withTimeout(
                withRateLimitRetry(
                  () => callSeedream45(avatarImageUrl, garmentImageUrl, category, REPLICATE_API_KEY),
                  "Seedream 4.5"
                ),
                MODEL_TIMEOUT_MS + (MAX_RATE_LIMIT_RETRIES * RATE_LIMIT_RETRY_DELAY_MS),
                "Seedream 4.5"
              );
            } else {
              result = { model: "seedream-4.5", status: "skipped", cost: "$0.00", error: "REPLICATE_API_KEY not configured" };
            }
            break;
          case "seedream-4.0":
            if (REPLICATE_API_KEY) {
              result = await withTimeout(
                withRateLimitRetry(
                  () => callSeedream40(avatarImageUrl, garmentImageUrl, category, REPLICATE_API_KEY),
                  "Seedream 4.0"
                ),
                MODEL_TIMEOUT_MS + (MAX_RATE_LIMIT_RETRIES * RATE_LIMIT_RETRY_DELAY_MS),
                "Seedream 4.0"
              );
            } else {
              result = { model: "seedream-4.0", status: "skipped", cost: "$0.00", error: "REPLICATE_API_KEY not configured" };
            }
            break;
          default:
            result = { model: modelName, status: "skipped", cost: "$0.00", error: "Unknown Replicate model" };
        }
      } catch (err: any) {
        result = { model: modelName, status: "failed", cost: "$0.00", error: err.message };
      }
      
      allResults.push(result);
      console.log(`[Replicate] ${modelName} completed: ${result.status} (${result.processingTimeMs || 0}ms)`);
    }

    // ============================================
    // Results Processing
    // ============================================
    
    // Use allResults for final processing
    const results = allResults;

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
          requestId: r.requestId,
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
