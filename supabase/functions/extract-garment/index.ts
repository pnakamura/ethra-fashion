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
    const { imageUrl, externalUrl, sourceType, sourceUrl } = body;

    console.log("Extract garment request:", {
      userId: user.id,
      sourceType,
      hasImage: !!imageUrl,
      hasExternalUrl: !!externalUrl,
    });

    let finalImageUrl = imageUrl;

    // If externalUrl is provided, fetch it server-side (bypasses CORS)
    if (externalUrl) {
      console.log("Fetching external URL server-side:", externalUrl);
      
      try {
        const imageResponse = await fetch(externalUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/*,*/*;q=0.8',
          },
        });

        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
        }

        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        // Check if it's actually an image
        if (!contentType.startsWith('image/')) {
          throw new Error('URL does not point to a valid image');
        }

        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageUint8Array = new Uint8Array(imageArrayBuffer);
        
        // Determine file extension from content type
        const extMap: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'image/gif': 'gif',
        };
        const ext = extMap[contentType] || 'jpg';
        
        const fileName = `${user.id}/external_${Date.now()}.${ext}`;
        
        console.log("Uploading fetched image to storage:", fileName);
        
        const { error: uploadError } = await supabase.storage
          .from('external-garments')
          .upload(fileName, imageUint8Array, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('external-garments')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
        console.log("Image uploaded, public URL:", finalImageUrl);
        
      } catch (fetchError) {
        console.error("Error fetching external URL:", fetchError);
        throw new Error(
          fetchError instanceof Error 
            ? `Não foi possível acessar esta URL: ${fetchError.message}`
            : 'Não foi possível acessar esta URL'
        );
      }
    }

    if (!finalImageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL or external URL is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    console.log("Removing background from garment image...");

    // Use background removal model to isolate the garment
    const output = await replicate.run(
      "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
      {
        input: {
          image: finalImageUrl,
        },
      }
    );

    console.log("Background removal completed");

    const processedImageUrl = output as string;

    // Detect category based on simple heuristics (could be enhanced with vision AI)
    const detectedCategory = detectCategory(sourceType);

    // Save to external_garments table
    const { data: garment, error: insertError } = await supabase
      .from("external_garments")
      .insert({
        user_id: user.id,
        source_type: sourceType || "url",
        original_image_url: finalImageUrl,
        processed_image_url: processedImageUrl,
        detected_category: detectedCategory,
        source_url: sourceUrl || externalUrl || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving garment:", insertError);
      throw new Error("Failed to save extracted garment");
    }

    // Return full garment object for consistency
    return new Response(
      JSON.stringify({
        success: true,
        garment: {
          id: garment.id,
          user_id: garment.user_id,
          source_type: garment.source_type,
          original_image_url: garment.original_image_url,
          processed_image_url: processedImageUrl,
          detected_category: detectedCategory,
          source_url: garment.source_url,
          name: garment.name,
          created_at: garment.created_at,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Extract garment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to extract garment";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function detectCategory(sourceType: string): string {
  return "upper_body";
}
