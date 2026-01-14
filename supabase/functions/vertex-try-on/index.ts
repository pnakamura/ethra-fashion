import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as base64url from "https://deno.land/std@0.168.0/encoding/base64url.ts";
import * as base64 from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Cloud OAuth2 token endpoint
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const VERTEX_API_BASE = "https://us-central1-aiplatform.googleapis.com/v1";

interface VertexTryOnRequest {
  avatarImageUrl: string;
  garmentImageUrl: string;
  category?: string;
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Helper to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Base64url encode (RFC 4648) - usando Deno std library para suporte UTF-8 completo
const base64urlEncode = (data: Uint8Array | string): string => {
  if (typeof data === 'string') {
    // Converter string para Uint8Array usando TextEncoder (suporta UTF-8)
    const bytes = new TextEncoder().encode(data);
    return base64url.encode(bytes.buffer as ArrayBuffer);
  }
  return base64url.encode((data as Uint8Array).buffer as ArrayBuffer);
};

// Create JWT for Google Cloud authentication
const createJWT = async (credentials: ServiceAccountCredentials): Promise<string> => {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600, // 1 hour
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const pemContents = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${signatureInput}.${encodedSignature}`;
};

// Get access token from Google OAuth2
const getAccessToken = async (credentials: ServiceAccountCredentials): Promise<string> => {
  console.log("[Vertex AI] Getting access token...");
  
  const jwt = await createJWT(credentials);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Vertex AI] Token error:", response.status, errorText);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  console.log("[Vertex AI] Access token obtained");
  return data.access_token;
};

// Fetch image as base64 - usando Deno std library para suporte a grandes arquivos
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  console.log(`[Vertex AI] Fetching image: ${url.substring(0, 50)}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  // Usar encode da std library (aceita ArrayBuffer diretamente)
  const encoded = base64.encode(arrayBuffer);
  console.log(`[Vertex AI] Image fetched, size: ${encoded.length} chars`);
  return encoded;
};

// Call Vertex AI Virtual Try-On
const callVertexTryOn = async (
  avatarImageUrl: string,
  garmentImageUrl: string,
  category: string,
  accessToken: string,
  projectId: string
): Promise<string> => {
  console.log("[Vertex AI] Starting try-on process...");
  console.log(`[Vertex AI] Category: ${category}`);

  // Fetch both images as base64
  const [avatarBase64, garmentBase64] = await Promise.all([
    fetchImageAsBase64(avatarImageUrl),
    fetchImageAsBase64(garmentImageUrl),
  ]);

  // Map category to Vertex AI format
  const getVtoCategory = (cat: string): string => {
    const normalized = (cat || "").toLowerCase();
    if (["top", "tops", "upper_body", "upper", "shirt", "blouse"].includes(normalized)) {
      return "TOPS";
    }
    if (["bottom", "bottoms", "lower_body", "lower", "pants", "skirt"].includes(normalized)) {
      return "BOTTOMS";
    }
    if (["dress", "dresses", "full_body"].includes(normalized)) {
      return "ONE_PIECES";
    }
    return "TOPS";
  };

  const vtoCategory = getVtoCategory(category);
  console.log(`[Vertex AI] VTO category: ${vtoCategory}`);

  // Vertex AI Virtual Try-On endpoint
  // Note: The exact endpoint may vary based on region and API version
  const endpoint = `${VERTEX_API_BASE}/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration@006:predict`;

  // Build the request for Virtual Try-On
  // Using Imagen 3 with virtual try-on capabilities
  const requestBody = {
    instances: [
      {
        prompt: `Virtual try-on: Apply the garment to the person. Category: ${vtoCategory}. Preserve exact identity, face, body proportions, and pose. Output photorealistic fashion photography.`,
        image: {
          bytesBase64Encoded: avatarBase64,
        },
        referenceImage: {
          bytesBase64Encoded: garmentBase64,
        },
        parameters: {
          sampleCount: 1,
          aspectRatio: "3:4",
          negativePrompt: "distorted, deformed, extra limbs, missing limbs, blurry, low quality",
          guidanceScale: 100,
          seed: Math.floor(Math.random() * 1000000),
        },
      },
    ],
    parameters: {
      sampleCount: 1,
    },
  };

  console.log("[Vertex AI] Sending request to Imagen...");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Vertex AI] API error:", response.status, errorText);
    
    if (response.status === 403) {
      throw new Error("Vertex AI: Permissão negada. Verifique as credenciais da Service Account.");
    }
    if (response.status === 429) {
      throw new Error("Vertex AI: Rate limit atingido. Aguarde e tente novamente.");
    }
    if (response.status === 400) {
      // Try alternative approach with Imagen edit
      console.log("[Vertex AI] Trying alternative Imagen edit approach...");
      return await callVertexImagenEdit(avatarBase64, garmentBase64, vtoCategory, accessToken, projectId);
    }
    throw new Error(`Vertex AI error: ${response.status}`);
  }

  const data = await response.json();
  console.log("[Vertex AI] Response received");

  // Extract the generated image
  const predictions = data.predictions;
  if (!predictions || predictions.length === 0) {
    throw new Error("Vertex AI: Nenhuma imagem gerada");
  }

  const imageBase64 = predictions[0].bytesBase64Encoded;
  if (!imageBase64) {
    throw new Error("Vertex AI: Resposta sem imagem");
  }

  console.log("[Vertex AI] Image generated successfully");
  return `data:image/png;base64,${imageBase64}`;
};

// Alternative approach using Imagen edit capabilities
const callVertexImagenEdit = async (
  avatarBase64: string,
  garmentBase64: string,
  category: string,
  accessToken: string,
  projectId: string
): Promise<string> => {
  console.log("[Vertex AI] Using Imagen edit approach...");

  const endpoint = `${VERTEX_API_BASE}/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration@006:predict`;

  const categoryPrompts: Record<string, string> = {
    TOPS: "Replace the shirt/top with the garment from the reference image. Keep exact face, body, and pose.",
    BOTTOMS: "Replace the pants/bottom with the garment from the reference image. Keep exact face, body, and pose.",
    ONE_PIECES: "Replace the outfit with the dress from the reference image. Keep exact face, body, and pose.",
  };

  const prompt = categoryPrompts[category] || categoryPrompts.TOPS;

  const requestBody = {
    instances: [
      {
        prompt: prompt,
        image: {
          bytesBase64Encoded: avatarBase64,
        },
      },
    ],
    parameters: {
      sampleCount: 1,
      editMode: "product-image",
      editConfig: {
        referenceImage: {
          bytesBase64Encoded: garmentBase64,
        },
      },
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Vertex AI Edit] Error:", response.status, errorText);
    throw new Error(`Vertex AI edit error: ${response.status}`);
  }

  const data = await response.json();
  const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;
  
  if (!imageBase64) {
    throw new Error("Vertex AI edit: Nenhuma imagem gerada");
  }

  console.log("[Vertex AI Edit] Image generated successfully");
  return `data:image/png;base64,${imageBase64}`;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body: VertexTryOnRequest = await req.json();
    const { avatarImageUrl, garmentImageUrl, category = "upper_body" } = body;

    console.log("=== Vertex AI Virtual Try-On ===");
    console.log("Category:", category);
    console.log("Avatar URL:", avatarImageUrl?.substring(0, 50) + "...");
    console.log("Garment URL:", garmentImageUrl?.substring(0, 50) + "...");

    if (!avatarImageUrl || !garmentImageUrl) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "avatarImageUrl e garmentImageUrl são obrigatórios" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get credentials from environment
    const credentialsJson = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS_JSON");
    if (!credentialsJson) {
      console.error("[Vertex AI] GOOGLE_APPLICATION_CREDENTIALS_JSON not configured");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Vertex AI não configurado. Credenciais não encontradas." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let credentials: ServiceAccountCredentials;
    try {
      credentials = JSON.parse(credentialsJson);
      console.log("[Vertex AI] Credentials parsed, project:", credentials.project_id);
    } catch (parseError) {
      console.error("[Vertex AI] Failed to parse credentials:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Credenciais do Vertex AI inválidas" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Get access token
    const accessToken = await getAccessToken(credentials);

    // Call Vertex AI
    const resultImageUrl = await callVertexTryOn(
      avatarImageUrl,
      garmentImageUrl,
      category,
      accessToken,
      credentials.project_id
    );

    const processingTime = Date.now() - startTime;
    console.log(`[Vertex AI] Completed in ${processingTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        resultImageUrl,
        processingTimeMs: processingTime,
        model: "vertex-ai-imagen",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Erro no Vertex AI";
    console.error("[Vertex AI] Error:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        processingTimeMs: processingTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
