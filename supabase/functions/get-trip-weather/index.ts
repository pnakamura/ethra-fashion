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

interface WeatherData {
  summary: string;
  temp_avg: number;
  temp_min: number;
  temp_max: number;
  rain_probability: number;
  conditions: string[];
}

interface SuggestedLook {
  occasion: string;
  items: string[];
  description: string;
}

interface WeatherRecommendations {
  weather: WeatherData;
  recommendations: {
    essential_items: string[];
    suggested_looks: SuggestedLook[];
    tips: string[];
  };
}

async function geocodeDestination(destination: string): Promise<{ lat: number; lon: number; name: string } | null> {
  console.log(`Geocoding destination: ${destination}`);
  
  try {
    const response = await fetch(
      `${OPEN_METEO_GEOCODING}?name=${encodeURIComponent(destination)}&count=1&language=pt&format=json`
    );
    
    if (!response.ok) {
      console.error("Geocoding failed:", response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log("No geocoding results found");
      return null;
    }
    
    const result = data.results[0];
    console.log(`Geocoded to: ${result.name}, ${result.country} (${result.latitude}, ${result.longitude})`);
    
    return {
      lat: result.latitude,
      lon: result.longitude,
      name: `${result.name}, ${result.country}`,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

async function getWeatherData(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<{ tempMin: number; tempMax: number; precipitationSum: number; conditions: string[] } | null> {
  console.log(`Fetching weather for ${lat}, ${lon} from ${startDate} to ${endDate}`);
  
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  try {
    let weatherData;
    
    if (daysUntilStart <= 16 && daysUntilStart >= 0) {
      // Use forecast API for near future
      const response = await fetch(
        `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&start_date=${startDate}&end_date=${endDate}&timezone=auto`
      );
      
      if (!response.ok) {
        console.error("Forecast API failed:", response.status);
        return null;
      }
      
      weatherData = await response.json();
    } else {
      // Use historical data from previous year for same period
      const lastYearStart = new Date(start);
      lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
      const lastYearEnd = new Date(end);
      lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);
      
      const response = await fetch(
        `${OPEN_METEO_HISTORICAL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&start_date=${lastYearStart.toISOString().split('T')[0]}&end_date=${lastYearEnd.toISOString().split('T')[0]}&timezone=auto`
      );
      
      if (!response.ok) {
        console.error("Historical API failed:", response.status);
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
    
    // Map weather codes to conditions
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

async function analyzeWithAI(
  weather: { tempMin: number; tempMax: number; precipitationSum: number; conditions: string[] },
  wardrobeItems: WardrobeItem[],
  tripType: string,
  destination: string,
  tripDays: number
): Promise<WeatherRecommendations> {
  console.log(`Analyzing with AI for ${wardrobeItems.length} wardrobe items`);
  
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }
  
  // Prepare wardrobe summary
  const itemsSummary = wardrobeItems.slice(0, 50).map((item) => ({
    id: item.id,
    name: item.name || item.category,
    category: item.category,
    season: item.season_tag,
    occasion: item.occasion,
  }));
  
  const systemPrompt = `Você é um consultor de moda especializado em planejamento de viagens. 
Analise as condições climáticas e o guarda-roupa do usuário para sugerir as melhores peças e combinações.
Responda APENAS com a chamada da função suggest_packing, sem texto adicional.`;

  const userPrompt = `
DESTINO: ${destination}
DURAÇÃO: ${tripDays} dias
TIPO DE VIAGEM: ${tripType}

CONDIÇÕES CLIMÁTICAS:
- Temperatura mínima: ${weather.tempMin}°C
- Temperatura máxima: ${weather.tempMax}°C  
- Probabilidade de chuva: ${weather.precipitationSum}%
- Condições: ${weather.conditions.join(", ")}

GUARDA-ROUPA DISPONÍVEL (${itemsSummary.length} peças):
${JSON.stringify(itemsSummary, null, 2)}

Com base nessas informações:
1. Crie um resumo amigável do clima esperado
2. Selecione as peças essenciais do guarda-roupa (IDs)
3. Monte 2-3 looks sugeridos para diferentes ocasiões da viagem
4. Forneça 2-3 dicas de vestuário para o destino`;

  const response = await fetch(LOVABLE_AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
            description: "Retorna sugestões de peças e looks para a viagem",
            parameters: {
              type: "object",
              properties: {
                weather_summary: {
                  type: "string",
                  description: "Resumo amigável do clima esperado em português",
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
                      occasion: { type: "string", description: "Ocasião do look (ex: passeio, jantar, praia)" },
                      items: { type: "array", items: { type: "string" }, description: "IDs das peças do look" },
                      description: { type: "string", description: "Descrição breve do look" },
                    },
                    required: ["occasion", "items", "description"],
                  },
                },
                tips: {
                  type: "array",
                  items: { type: "string" },
                  description: "Dicas de vestuário para o destino",
                },
              },
              required: ["weather_summary", "essential_items", "suggested_looks", "tips"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "suggest_packing" } },
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded");
    }
    if (response.status === 402) {
      throw new Error("Payment required");
    }
    throw new Error(`AI analysis failed: ${response.status}`);
  }
  
  const data = await response.json();
  console.log("AI response received");
  
  // Extract tool call result
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== "suggest_packing") {
    console.error("Unexpected AI response format:", JSON.stringify(data));
    throw new Error("Invalid AI response format");
  }
  
  const suggestions = JSON.parse(toolCall.function.arguments);
  
  return {
    weather: {
      summary: suggestions.weather_summary,
      temp_avg: Math.round((weather.tempMin + weather.tempMax) / 2),
      temp_min: Math.round(weather.tempMin),
      temp_max: Math.round(weather.tempMax),
      rain_probability: Math.round(weather.precipitationSum),
      conditions: weather.conditions,
    },
    recommendations: {
      essential_items: suggestions.essential_items || [],
      suggested_looks: suggestions.suggested_looks || [],
      tips: suggestions.tips || [],
    },
  };
}

serve(async (req) => {
  // Handle CORS
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
    
    // Geocode destination
    const location = await geocodeDestination(destination);
    if (!location) {
      return new Response(
        JSON.stringify({ error: "Could not find destination. Try a more specific location." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get weather data
    const weather = await getWeatherData(location.lat, location.lon, start_date, end_date);
    if (!weather) {
      return new Response(
        JSON.stringify({ error: "Could not fetch weather data for this period." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Calculate trip duration
    const tripDays = Math.ceil(
      (new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    
    // Fetch user's wardrobe items
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
    
    // If no wardrobe items, return basic weather info
    if (wardrobeItems.length === 0) {
      return new Response(
        JSON.stringify({
          weather: {
            summary: `Clima em ${location.name}: ${weather.tempMin}°C a ${weather.tempMax}°C`,
            temp_avg: Math.round((weather.tempMin + weather.tempMax) / 2),
            temp_min: Math.round(weather.tempMin),
            temp_max: Math.round(weather.tempMax),
            rain_probability: Math.round(weather.precipitationSum),
            conditions: weather.conditions,
          },
          recommendations: {
            essential_items: [],
            suggested_looks: [],
            tips: [
              "Adicione peças ao seu guarda-roupa para receber sugestões personalizadas",
            ],
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Analyze with AI
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
