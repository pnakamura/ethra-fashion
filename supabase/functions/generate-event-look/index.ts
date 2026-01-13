import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const dressCodeDescriptions: Record<string, string> = {
  black_tie: 'Black Tie - Traje de gala ultra formal. Homens: smoking preto. Mulheres: vestido longo elegante.',
  cocktail: 'Cocktail - Semi-formal sofisticado. Vestidos midi/curtos elegantes, ternos bem cortados.',
  formal: 'Formal/Traje Social - Terno e gravata para homens, vestido ou conjunto elegante para mulheres.',
  smart_casual: 'Smart Casual - Elegante mas descontraído. Blazer opcional, peças bem acabadas.',
  casual_chic: 'Casual Chic - Descontraído mas estiloso. Jeans escuro com peças mais sofisticadas funciona.',
  casual: 'Casual - Confortável e apropriado. Evite roupas esportivas ou muito informais.',
  theme: 'Temático - Considere o tema específico do evento na escolha das peças.',
};

const eventTypeContext: Record<string, string> = {
  wedding: 'Casamento - Evite branco (reservado para noiva). Tons pastel, florais ou cores vibrantes são ótimas escolhas.',
  graduation: 'Formatura - Momento de celebração! Cores alegres, peças statement. O protagonista é o formando.',
  gala: 'Gala/Baile - Evento glamouroso. Peças luxuosas, tecidos nobres, acessórios marcantes.',
  anniversary: 'Aniversário - Celebração pessoal. Adapte ao estilo do aniversariante e local.',
  corporate: 'Corporativo - Profissional mas elegante. Cores neutras com toques de personalidade.',
  special: 'Evento Especial - Adapte ao contexto específico do evento.',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title, eventDate, eventTime, eventType, dressCode, location, notes } = await req.json();

    console.log(`Generating event look for ${title} (${eventType}, ${dressCode})`);

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('color_season, color_analysis')
      .eq('user_id', user.id)
      .single();

    // Fetch wardrobe items prioritizing compatible ones
    const { data: items } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', user.id)
      .order('chromatic_compatibility', { ascending: true });

    if (!items || items.length < 2) {
      return new Response(
        JSON.stringify({ 
          suggestions: [],
          message: 'Adicione mais peças ao seu closet para receber sugestões.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to get weather for the event date if location provided
    let weatherContext = '';
    if (location) {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=pt&format=json`
        );
        const geoData = await geoRes.json();

        if (geoData.results?.[0]) {
          const { latitude, longitude } = geoData.results[0];
          const eventDateObj = new Date(eventDate);
          const today = new Date();
          const daysUntilEvent = Math.ceil((eventDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilEvent > 0 && daysUntilEvent <= 16) {
            const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=${Math.min(daysUntilEvent + 1, 16)}`
            );
            const weatherData = await weatherRes.json();

            if (weatherData.daily) {
              const eventIndex = Math.min(daysUntilEvent, weatherData.daily.time.length - 1);
              const maxTemp = weatherData.daily.temperature_2m_max[eventIndex];
              const minTemp = weatherData.daily.temperature_2m_min[eventIndex];

              weatherContext = `\n## CLIMA PREVISTO
Temperatura: ${minTemp}°C a ${maxTemp}°C
Considere o clima ao escolher tecidos e camadas.`;
            }
          }
        }
      } catch (e) {
        console.log('Weather fetch failed:', e);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const colorAnalysis = profile?.color_analysis as any;
    const chromaticContext = colorAnalysis ? `
## PERFIL CROMÁTICO
Estação: ${colorAnalysis.season} ${colorAnalysis.subtype || ''}
Cores ideais: ${colorAnalysis.recommended_colors?.slice(0, 6).join(', ') || 'variadas'}
Cores a evitar: ${colorAnalysis.avoid_colors?.slice(0, 3).join(', ') || 'nenhuma específica'}
` : '';

    // Group items by category
    const itemsByCategory: Record<string, any[]> = {};
    items.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });

    const wardrobeDesc = Object.entries(itemsByCategory).map(([category, catItems]) => {
      const itemsList = catItems.slice(0, 8).map(item => 
        `  - ${item.id}: ${item.name || category} (${item.chromatic_compatibility || 'neutro'}${item.color_code ? ', ' + item.color_code : ''})`
      ).join('\n');
      return `### ${category}\n${itemsList}`;
    }).join('\n\n');

    const dressCodeInfo = dressCodeDescriptions[dressCode] || dressCode;
    const eventTypeInfo = eventTypeContext[eventType] || eventType;

    const prompt = `Você é Aura, personal stylist de luxo especializada em eventos especiais.

## EVENTO
Nome: ${title}
Tipo: ${eventTypeInfo}
Dress Code: ${dressCodeInfo}
Data: ${eventDate}${eventTime ? ` às ${eventTime}` : ''}
${location ? `Local: ${location}` : ''}
${notes ? `Notas: ${notes}` : ''}
${weatherContext}

${chromaticContext}

## GUARDA-ROUPA DO CLIENTE
${wardrobeDesc}

Crie 2 sugestões de looks completos para este evento, priorizando:
1. Adequação ao dress code
2. Harmonia cromática com o perfil do cliente
3. Peças marcadas como "Ideal" ou "Neutro"

Retorne APENAS JSON válido:
{
  "suggestions": [
    {
      "look_name": "Nome criativo do look",
      "items": ["uuid1", "uuid2", "uuid3"],
      "explanation": "Explicação de porque este look funciona para o evento (máx 50 palavras)",
      "styling_tips": "Uma dica de styling ou acessório que complementaria (máx 30 palavras)",
      "score": 95
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI error:', await response.text());
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar sugestões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (e) {
      console.error('Parse error:', content);
      return new Response(
        JSON.stringify({ error: 'Falha ao processar sugestões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and enrich suggestions with item details
    const validSuggestions = (result.suggestions || []).map((suggestion: any) => {
      const validItems = suggestion.items
        .map((id: string) => items.find(item => item.id === id))
        .filter(Boolean);

      return {
        ...suggestion,
        items: validItems.map((item: any) => item.id),
        item_details: validItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          image_url: item.image_url,
        })),
      };
    }).filter((s: any) => s.items.length >= 2);

    console.log(`Generated ${validSuggestions.length} look suggestions for event ${title}`);

    return new Response(
      JSON.stringify({
        suggestions: validSuggestions,
        eventType,
        dressCode,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
