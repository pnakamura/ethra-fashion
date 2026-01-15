import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPEN_METEO_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_HISTORICAL = "https://archive-api.open-meteo.com/v1/archive";

interface WardrobeItem {
  id: string;
  name: string | null;
  category: string;
  season_tag: string | null;
  occasion: string | null;
  image_url: string;
}

interface PackingItem {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  colors: string[];
  styles: string[];
  fabrics: string[];
  in_wardrobe: boolean;
  image_url?: string;
  reason: string;
}

interface PackingList {
  roupas: PackingItem[];
  calcados: PackingItem[];
  acessorios: PackingItem[];
  chapeus: PackingItem[];
}

interface SuggestedLook {
  name: string;
  occasion: string;
  items: string[];
  description: string;
  style_tip: string;
}

interface TipsCategories {
  essentials: string[];
  local_culture: string[];
  avoid: string[];
  pro_tips: string[];
}

interface WeatherData {
  summary: string;
  climate_vibe: string;
  packing_mood: string;
  temp_avg: number;
  temp_min: number;
  temp_max: number;
  rain_probability: number;
  conditions: string[];
}

interface WeatherRecommendations {
  weather: WeatherData;
  trip_brief: string;
  recommendations: {
    essential_items: string[];
    suggested_looks: SuggestedLook[];
    tips: TipsCategories;
  };
  packing_list: PackingList;
}

// Map trip type to more descriptive Portuguese label
function getTripTypeLabel(tripType: string): string {
  const labels: Record<string, string> = {
    leisure: "lazer e turismo",
    business: "negócios e reuniões",
    adventure: "aventura e esportes",
    romantic: "viagem romântica",
    beach: "praia e relaxamento",
  };
  return labels[tripType] || tripType;
}

// Get climate vibe based on conditions and temperature
function inferClimateVibe(conditions: string[], tempAvg: number): string {
  if (conditions.includes("snowy")) return "winter_wonderland";
  if (conditions.includes("rainy") || conditions.includes("stormy")) return "rainy_adventure";
  if (tempAvg >= 28 && (conditions.includes("sunny") || conditions.includes("partly_cloudy"))) return "tropical_beach";
  if (tempAvg >= 22 && tempAvg < 28) return "warm_vibes";
  if (tempAvg >= 15 && tempAvg < 22) return "mild_comfort";
  if (tempAvg < 15) return "cozy_layers";
  return "versatile_weather";
}

async function geocodeDestination(destination: string): Promise<{ lat: number; lon: number; name: string } | null> {
  console.log(`Geocoding destination: ${destination}`);
  
  const searchTerms = [
    destination,
    destination.split(',')[0].trim(),
    destination.replace(/,/g, ' ').trim(),
  ];
  
  for (const term of searchTerms) {
    try {
      console.log(`Trying geocoding with: ${term}`);
      
      const response = await fetch(
        `${OPEN_METEO_GEOCODING}?name=${encodeURIComponent(term)}&count=5&language=pt&format=json`
      );
      
      if (!response.ok) {
        console.error("Geocoding failed:", response.status);
        continue;
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log(`Geocoded to: ${result.name}, ${result.country} (${result.latitude}, ${result.longitude})`);
        
        return {
          lat: result.latitude,
          lon: result.longitude,
          name: `${result.name}, ${result.country}`,
        };
      }
    } catch (error) {
      console.error("Geocoding error for term:", term, error);
    }
  }
  
  console.log("No geocoding results found for any search term");
  return null;
}

async function getWeatherData(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<{ tempMin: number; tempMax: number; precipitationSum: number; conditions: string[] } | null> {
  console.log(`Fetching weather for ${lat}, ${lon} from ${startDate} to ${endDate}`);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const daysUntilEnd = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  try {
    let weatherData;
    
    if (daysUntilEnd <= 16) {
      console.log("Using forecast API (within 16 days)");
      const response = await fetch(
        `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&start_date=${startDate}&end_date=${endDate}&timezone=auto`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Forecast API failed:", response.status, errorText);
      } else {
        weatherData = await response.json();
      }
    }
    
    if (!weatherData) {
      console.log("Using historical data (previous year same period)");
      const lastYearStart = new Date(start);
      lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
      const lastYearEnd = new Date(end);
      lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);
      
      const histStartStr = lastYearStart.toISOString().split('T')[0];
      const histEndStr = lastYearEnd.toISOString().split('T')[0];
      
      console.log(`Historical period: ${histStartStr} to ${histEndStr}`);
      
      const response = await fetch(
        `${OPEN_METEO_HISTORICAL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&start_date=${histStartStr}&end_date=${histEndStr}&timezone=auto`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Historical API failed:", response.status, errorText);
        return null;
      }
      
      weatherData = await response.json();
    }
    
    if (!weatherData.daily) {
      console.log("No daily weather data");
      return null;
    }
    
    const daily = weatherData.daily;
    const tempMin = Math.min(...daily.temperature_2m_min);
    const tempMax = Math.max(...daily.temperature_2m_max);
    const precipitationSum = daily.precipitation_probability_max
      ? Math.max(...daily.precipitation_probability_max)
      : daily.precipitation_sum
        ? daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0)
        : 0;
    
    const weatherCodes = daily.weathercode || [];
    const conditions = new Set<string>();
    
    for (const code of weatherCodes) {
      if (code === 0) conditions.add("sunny");
      else if (code >= 1 && code <= 3) conditions.add("partly_cloudy");
      else if (code >= 45 && code <= 48) conditions.add("foggy");
      else if (code >= 51 && code <= 67) conditions.add("rainy");
      else if (code >= 71 && code <= 77) conditions.add("snowy");
      else if (code >= 80 && code <= 82) conditions.add("showers");
      else if (code >= 95) conditions.add("stormy");
    }
    
    console.log(`Weather: ${tempMin}°C - ${tempMax}°C, precipitation: ${precipitationSum}%`);
    
    return {
      tempMin,
      tempMax,
      precipitationSum,
      conditions: Array.from(conditions),
    };
  } catch (error) {
    console.error("Weather fetch error:", error);
    return null;
  }
}

// Helper function to call AI with automatic retry on transient errors
async function callAIWithRetry(
  payload: object,
  maxRetries = 2,
  delayMs = 2000
): Promise<{ ok: boolean; status: number; data: any }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`AI Gateway retry attempt ${attempt} after error`);
      await new Promise((r) => setTimeout(r, delayMs));
    }

    try {
      const response = await fetch(LOVABLE_AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Check for internal errors in response body (AI Gateway may return 200 with error)
      if (data.error?.code === 500 || data.error?.message?.includes("Internal")) {
        console.log(`AI Gateway internal error on attempt ${attempt}: ${data.error.message}`);
        lastError = new Error(`AI Gateway internal error: ${data.error.message}`);
        continue; // Retry
      }

      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        console.log(`AI Gateway 5xx error on attempt ${attempt}: ${response.status}`);
        lastError = new Error(`AI Gateway error: ${response.status}`);
        continue; // Retry
      }

      return { ok: response.ok, status: response.status, data };
    } catch (fetchError) {
      console.error(`Fetch error on attempt ${attempt}:`, fetchError);
      lastError = fetchError instanceof Error ? fetchError : new Error("Network error");
      if (attempt < maxRetries) continue;
    }
  }

  throw lastError || new Error("AI Gateway failed after retries");
}

async function analyzeWithAI(
  weather: { tempMin: number; tempMax: number; precipitationSum: number; conditions: string[] },
  wardrobeItems: WardrobeItem[],
  tripType: string,
  destination: string,
  tripDays: number
): Promise<WeatherRecommendations> {
  console.log(`Analyzing with AI for ${wardrobeItems.length} wardrobe items`);

  const itemsSummary = wardrobeItems.slice(0, 50).map((item) => ({
    id: item.id,
    name: item.name || item.category,
    category: item.category,
    season: item.season_tag,
    occasion: item.occasion,
  }));

  const tripTypeLabel = getTripTypeLabel(tripType);
  const tempAvg = Math.round((weather.tempMin + weather.tempMax) / 2);
  const climateVibe = inferClimateVibe(weather.conditions, tempAvg);

  const systemPrompt = `Você é a Aura, uma personal stylist brasileira especializada em viagens. 
Seu tom é sofisticado mas descontraído, como uma amiga fashion que adora dar dicas. 
Use expressões naturais e um emoji ocasional para dar personalidade (mas sem exagerar!).

REGRAS DE OURO:
- Seja específica sobre o destino: mencione pontos turísticos, cultura local, bairros famosos
- Faça trocadilhos leves relacionados à moda quando cabível
- Dê dicas práticas mas com charme editorial
- Considere as atividades típicas do tipo de viagem
- Sugira looks com nomes criativos e evocativos (ex: "Sunset em Porto da Barra", "City Explorer")
- Use linguagem que pareça uma conversa entre amigas, não um manual técnico
- Cada look precisa ter um style_tip específico e útil

IMPORTANTE SOBRE PACKING_LIST:
- Analise cuidadosamente o guarda-roupa fornecido
- Para itens que existem no closet, use o ID exato e marque in_wardrobe=true
- Para itens que NÃO existem, crie sugestões com in_wardrobe=false
- Especifique quantidades baseadas na duração da viagem
- Sugira cores, estilos e tecidos ideais para o clima
- Organize em: roupas, calcados, acessorios, chapeus
- Cada item precisa de uma razão clara (porque levar/comprar)

Os IDs das peças DEVEM ser IDs válidos do guarda-roupa fornecido quando in_wardrobe=true.`;

  const userPrompt = `
🌍 DESTINO: ${destination}
📅 DURAÇÃO: ${tripDays} dias
✈️ TIPO DE VIAGEM: ${tripTypeLabel}

☀️ CONDIÇÕES CLIMÁTICAS:
- Temperatura mínima: ${weather.tempMin}°C
- Temperatura máxima: ${weather.tempMax}°C  
- Probabilidade de chuva: ${weather.precipitationSum}%
- Condições: ${weather.conditions.join(", ")}

👗 GUARDA-ROUPA DISPONÍVEL (${itemsSummary.length} peças):
${JSON.stringify(itemsSummary, null, 2)}

Por favor, analise e crie:

1. **weather_summary**: Um resumo CRIATIVO e DIVERTIDO do clima em até 2 frases.

2. **climate_vibe**: Use "${climateVibe}" ou sugira outro se achar melhor

3. **packing_mood**: Uma frase inspiracional/mantra para a mala

4. **trip_brief**: Um parágrafo editorial (3-4 frases) sobre a vibe do destino

5. **packing_list**: Lista categorizada de itens para a mala:
   - roupas: camisas, calças, vestidos, etc.
   - calcados: tênis, sandálias, sapatos, etc.
   - acessorios: bolsas, cintos, óculos, relógios, etc.
   - chapeus: bonés, chapéus, lenços, etc.
   
   Para cada item inclua:
   - id: ID do guarda-roupa se existir, senão omita
   - name: Nome descritivo (ex: "Vestido de Linho Branco")
   - category: Subcategoria específica
   - quantity: Quantidade recomendada
   - colors: Array de cores em HEX (ex: ["#FFFFFF", "#F5F5DC"])
   - styles: Array de estilos (casual, formal, esportivo, etc.)
   - fabrics: Array de tecidos ideais (linho, algodão, seda, etc.)
   - in_wardrobe: true se a peça existe no closet, false se é sugestão
   - image_url: URL da imagem se do closet
   - reason: Por que essa peça é recomendada para a viagem

6. **essential_items**: IDs das peças ESSENCIAIS do guarda-roupa (máximo 8)

7. **suggested_looks**: 3 looks criativos com nome, ocasião, items, description, style_tip

8. **tips**: Categorize em essentials, local_culture, avoid, pro_tips (2 cada)`;

  const payload = {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "suggest_packing",
          description: "Retorna sugestões de peças e looks para a viagem com checklist categorizado",
          parameters: {
            type: "object",
            properties: {
              weather_summary: {
                type: "string",
                description: "Resumo criativo e amigável do clima em português",
              },
              climate_vibe: {
                type: "string",
                description: "Vibe climática",
              },
              packing_mood: {
                type: "string",
                description: "Frase inspiracional/mantra para a mala",
              },
              trip_brief: {
                type: "string",
                description: "Parágrafo editorial sobre o destino",
              },
              packing_list: {
                type: "object",
                description: "Lista categorizada de itens para a mala",
                properties: {
                  roupas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "ID do guarda-roupa se existir" },
                        name: { type: "string" },
                        category: { type: "string" },
                        quantity: { type: "number" },
                        colors: { type: "array", items: { type: "string" } },
                        styles: { type: "array", items: { type: "string" } },
                        fabrics: { type: "array", items: { type: "string" } },
                        in_wardrobe: { type: "boolean" },
                        image_url: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["name", "category", "quantity", "colors", "styles", "fabrics", "in_wardrobe", "reason"],
                    },
                  },
                  calcados: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        category: { type: "string" },
                        quantity: { type: "number" },
                        colors: { type: "array", items: { type: "string" } },
                        styles: { type: "array", items: { type: "string" } },
                        fabrics: { type: "array", items: { type: "string" } },
                        in_wardrobe: { type: "boolean" },
                        image_url: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["name", "category", "quantity", "colors", "styles", "fabrics", "in_wardrobe", "reason"],
                    },
                  },
                  acessorios: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        category: { type: "string" },
                        quantity: { type: "number" },
                        colors: { type: "array", items: { type: "string" } },
                        styles: { type: "array", items: { type: "string" } },
                        fabrics: { type: "array", items: { type: "string" } },
                        in_wardrobe: { type: "boolean" },
                        image_url: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["name", "category", "quantity", "colors", "styles", "fabrics", "in_wardrobe", "reason"],
                    },
                  },
                  chapeus: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        category: { type: "string" },
                        quantity: { type: "number" },
                        colors: { type: "array", items: { type: "string" } },
                        styles: { type: "array", items: { type: "string" } },
                        fabrics: { type: "array", items: { type: "string" } },
                        in_wardrobe: { type: "boolean" },
                        image_url: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["name", "category", "quantity", "colors", "styles", "fabrics", "in_wardrobe", "reason"],
                    },
                  },
                },
                required: ["roupas", "calcados", "acessorios", "chapeus"],
              },
              essential_items: {
                type: "array",
                items: { type: "string" },
                description: "Lista de IDs das peças essenciais do guarda-roupa",
              },
              suggested_looks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    occasion: { type: "string" },
                    items: { type: "array", items: { type: "string" } },
                    description: { type: "string" },
                    style_tip: { type: "string" },
                  },
                  required: ["name", "occasion", "items", "description", "style_tip"],
                },
              },
              tips: {
                type: "object",
                properties: {
                  essentials: { type: "array", items: { type: "string" } },
                  local_culture: { type: "array", items: { type: "string" } },
                  avoid: { type: "array", items: { type: "string" } },
                  pro_tips: { type: "array", items: { type: "string" } },
                },
                required: ["essentials", "local_culture", "avoid", "pro_tips"],
              },
            },
            required: ["weather_summary", "climate_vibe", "packing_mood", "trip_brief", "packing_list", "essential_items", "suggested_looks", "tips"],
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "suggest_packing" } },
  };

  // Use the retry wrapper
  const { ok, status, data } = await callAIWithRetry(payload);

  if (!ok) {
    console.error("AI Gateway error after retries:", status);
    if (status === 429) {
      throw new Error("Rate limit exceeded");
    }
    if (status === 402) {
      throw new Error("Payment required");
    }
    throw new Error(`AI analysis failed: ${status}`);
  }

  console.log("AI response received");
  
  // Check if response contains an error (AI Gateway may return 200 with error body)
  if (data.error) {
    console.error("AI Gateway returned error in body:", JSON.stringify(data));
    throw new Error(`AI service error: ${data.error.message || 'Unknown error'}`);
  }
  
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== "suggest_packing") {
    // Try to extract from regular content as fallback
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log("Attempting to parse from content fallback");
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.weather_summary || parsed.essential_items) {
            console.log("Successfully parsed from content fallback");
            const tempAvg = Math.round((weather.tempMin + weather.tempMax) / 2);
            const tips: TipsCategories = {
              essentials: parsed.tips?.essentials || [],
              local_culture: parsed.tips?.local_culture || [],
              avoid: parsed.tips?.avoid || [],
              pro_tips: parsed.tips?.pro_tips || [],
            };
            return {
              weather: {
                summary: parsed.weather_summary || `Temperatura entre ${weather.tempMin}°C e ${weather.tempMax}°C`,
                climate_vibe: parsed.climate_vibe || climateVibe,
                packing_mood: parsed.packing_mood || "Viaje leve, viaje com estilo!",
                temp_avg: tempAvg,
                temp_min: Math.round(weather.tempMin),
                temp_max: Math.round(weather.tempMax),
                rain_probability: Math.round(weather.precipitationSum),
                conditions: weather.conditions,
              },
              trip_brief: parsed.trip_brief || "",
              recommendations: {
                essential_items: parsed.essential_items || [],
                suggested_looks: parsed.suggested_looks || [],
                tips,
              },
              packing_list: parsed.packing_list || { roupas: [], calcados: [], acessorios: [], chapeus: [] },
            };
          }
        }
      } catch (parseErr) {
        console.error("Content fallback parse failed:", parseErr);
      }
    }
    console.error("Unexpected AI response format:", JSON.stringify(data));
    throw new Error("Invalid AI response format");
  }
  
  const suggestions = JSON.parse(toolCall.function.arguments);
  
  // Ensure tips is properly structured
  const tips: TipsCategories = {
    essentials: suggestions.tips?.essentials || [],
    local_culture: suggestions.tips?.local_culture || [],
    avoid: suggestions.tips?.avoid || [],
    pro_tips: suggestions.tips?.pro_tips || [],
  };
  
  return {
    weather: {
      summary: suggestions.weather_summary,
      climate_vibe: suggestions.climate_vibe || climateVibe,
      packing_mood: suggestions.packing_mood || "Viaje leve, viaje com estilo!",
      temp_avg: tempAvg,
      temp_min: Math.round(weather.tempMin),
      temp_max: Math.round(weather.tempMax),
      rain_probability: Math.round(weather.precipitationSum),
      conditions: weather.conditions,
    },
    trip_brief: suggestions.trip_brief || "",
    recommendations: {
      essential_items: suggestions.essential_items || [],
      suggested_looks: suggestions.suggested_looks || [],
      tips,
    },
    packing_list: suggestions.packing_list || { roupas: [], calcados: [], acessorios: [], chapeus: [] },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { destination, start_date, end_date, trip_type, user_id } = await req.json();
    
    console.log(`Processing trip weather request: ${destination}, ${start_date} to ${end_date}`);
    
    if (!destination || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: destination, start_date, end_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const location = await geocodeDestination(destination);
    if (!location) {
      return new Response(
        JSON.stringify({ error: "Could not find destination. Try a more specific location." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const weather = await getWeatherData(location.lat, location.lon, start_date, end_date);
    if (!weather) {
      return new Response(
        JSON.stringify({ error: "Could not fetch weather data for this period." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const tripDays = Math.ceil(
      (new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    
    let wardrobeItems: WardrobeItem[] = [];
    
    if (user_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: items, error } = await supabase
        .from("wardrobe_items")
        .select("id, name, category, season_tag, occasion, image_url")
        .eq("user_id", user_id);
      
      if (error) {
        console.error("Error fetching wardrobe:", error);
      } else {
        wardrobeItems = items || [];
      }
    }
    
    console.log(`Found ${wardrobeItems.length} wardrobe items for user`);
    
    // If no wardrobe items, return basic weather info with creative defaults
    if (wardrobeItems.length === 0) {
      const tempAvg = Math.round((weather.tempMin + weather.tempMax) / 2);
      const climateVibe = inferClimateVibe(weather.conditions, tempAvg);
      
      return new Response(
        JSON.stringify({
          weather: {
            summary: `${location.name} te espera com temperaturas entre ${Math.round(weather.tempMin)}°C e ${Math.round(weather.tempMax)}°C. Prepare-se para dias incríveis! ✨`,
            climate_vibe: climateVibe,
            packing_mood: "Primeiro passo: adicione suas peças ao closet! 👗",
            temp_avg: tempAvg,
            temp_min: Math.round(weather.tempMin),
            temp_max: Math.round(weather.tempMax),
            rain_probability: Math.round(weather.precipitationSum),
            conditions: weather.conditions,
          },
          trip_brief: "Adicione peças ao seu guarda-roupa virtual para que eu possa criar looks perfeitos para sua viagem! Quanto mais peças você tiver, mais personalizada será a sua mala.",
          recommendations: {
            essential_items: [],
            suggested_looks: [],
            tips: {
              essentials: ["Adicione peças ao seu closet para receber sugestões personalizadas"],
              local_culture: [],
              avoid: [],
              pro_tips: ["Fotografe suas roupas favoritas para ter sempre à mão"],
            },
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const result = await analyzeWithAI(
      weather,
      wardrobeItems,
      trip_type || "leisure",
      location.name,
      tripDays
    );
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-trip-weather error:", error);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Rate limit") ? 429 : message.includes("Payment") ? 402 : 500;
    
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
