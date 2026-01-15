import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { occasion, count = 3 } = await req.json();

    console.log(`Generating ${count} looks for user ${user.id}, occasion: ${occasion || 'any'}`);

    // Fetch user's chromatic profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('color_season, color_analysis')
      .eq('user_id', user.id)
      .single();

    // Fetch user's wardrobe items (prioritize ideal compatibility)
    const { data: items } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', user.id)
      .order('chromatic_compatibility', { ascending: true }); // ideal first

    if (!items || items.length < 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Guarda-roupa insuficiente',
          message: 'Adicione pelo menos 3 peças para receber recomendações de looks.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build wardrobe description with color details
    const wardrobeDescription = items.map(item => {
      const colors = item.dominant_colors 
        ? (item.dominant_colors as any[]).map(c => `${c.name} (${c.hex})`).join(', ')
        : item.color_code || 'cor não analisada';
      return `- ID: ${item.id} | ${item.category} | Cores: ${colors} | Compatibilidade: ${item.chromatic_compatibility || 'unknown'}`;
    }).join('\n');

    const colorAnalysis = profile?.color_analysis as any;
    const chromaticContext = colorAnalysis ? `
## PERFIL CROMÁTICO DO USUÁRIO
Estação cromática: ${colorAnalysis.season} ${colorAnalysis.subtype || ''}
Cores recomendadas: ${colorAnalysis.recommended_colors?.slice(0, 6).join(', ') || 'não definidas'}
Cores a evitar: ${colorAnalysis.avoid_colors?.slice(0, 4).join(', ') || 'não definidas'}
Tom de pele: ${colorAnalysis.skin_tone || 'não definido'}
Subtom: ${colorAnalysis.undertone || 'não definido'}
` : 'Análise cromática não disponível. Sugira looks harmoniosos baseados nas cores das peças.';

    // Enhanced prompt with color theory
    const prompt = `Você é Aura, uma stylist virtual de luxo especializada em colorimetria pessoal e teoria das cores.

${chromaticContext}

## GUARDA-ROUPA DISPONÍVEL
${wardrobeDescription}

${occasion ? `## OCASIÃO DESEJADA: ${occasion}` : '## OCASIÃO: Variada (crie looks para diferentes momentos)'}

## TEORIA DAS CORES - USE ISSO PARA CRIAR HARMONIAS

Tipos de Harmonia Cromática:
1. **Monocromática**: Tons da mesma cor em diferentes saturações e valores. Elegante e sofisticado.
2. **Análoga**: Cores adjacentes no círculo cromático (ex: azul + verde-azulado + verde). Harmoniosa e natural.
3. **Complementar**: Cores opostas no círculo (ex: azul + laranja). Alto impacto e contraste.
4. **Tríade**: Três cores equidistantes (ex: vermelho + azul + amarelo). Vibrante e equilibrado.
5. **Neutral + Accent**: Base neutra com uma cor de destaque. Clássico e versátil.

## TAREFA
Crie exatamente ${count} looks completos e harmonioso usando APENAS peças do guarda-roupa acima.

## REGRAS IMPORTANTES
1. **PRIORIZE** peças com compatibilidade "ideal" - elas são as melhores para a estação do usuário
2. Use peças "neutral" como base ou complemento
3. **EVITE** peças com compatibilidade "avoid" sempre que possível
4. Cada look deve ter 2-4 peças que funcionem bem juntas
5. Considere a harmonia entre as cores das peças (use a teoria das cores)
6. Dê nomes criativos e elegantes aos looks (em português)
7. Explique a harmonia de cores usando termos da teoria das cores
8. Calcule um score de 0-100 baseado na compatibilidade cromática das peças

## CÁLCULO DO CHROMATIC SCORE
- Peça "ideal" = 100 pontos
- Peça "neutral" = 50 pontos  
- Peça "avoid" = 0 pontos
- Score final = média de todas as peças do look

Retorne APENAS um objeto JSON válido (sem markdown, sem backticks):
{
  "looks": [
    {
      "name": "Nome elegante e criativo em português",
      "items": ["uuid1", "uuid2", "uuid3"],
      "occasion": "casual|trabalho|festa|formal",
      "harmony_type": "monocromática|análoga|complementar|tríade|neutral_accent",
      "color_harmony": "Explicação da harmonia de cores usando teoria das cores (máx 50 palavras)",
      "chromatic_score": 85,
      "styling_tip": "Dica de styling, acessório ou como vestir"
    }
  ]
}`;

    // Helper function to call AI with automatic retry on transient errors
    const fetchAIWithRetry = async (maxRetries = 2, delayMs = 2000): Promise<any> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
          console.log(`AI Gateway retry attempt ${attempt}`);
          await new Promise((r) => setTimeout(r, delayMs));
        }

        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 2500,
              temperature: 0.7,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('AI gateway error:', response.status, errorText);

            // Retry on 5xx errors
            if (response.status >= 500 && attempt < maxRetries) {
              lastError = new Error(`AI Gateway error: ${response.status}`);
              continue;
            }

            if (response.status === 429) {
              throw { status: 429, message: 'Muitas requisições. Tente novamente em alguns segundos.' };
            }
            if (response.status === 402) {
              throw { status: 402, message: 'Créditos de IA esgotados.' };
            }

            throw { status: 500, message: 'Erro ao gerar looks' };
          }

          const data = await response.json();

          // Check for internal errors in response body
          if (data.error?.code === 500 || data.error?.message?.includes('Internal')) {
            console.log(`AI Gateway internal error on attempt ${attempt}: ${data.error.message}`);
            lastError = new Error(`AI Gateway internal error: ${data.error.message}`);
            continue;
          }

          return data;
        } catch (fetchError: any) {
          if (fetchError.status) throw fetchError; // Re-throw structured errors
          console.error(`Fetch error on attempt ${attempt}:`, fetchError);
          lastError = fetchError instanceof Error ? fetchError : new Error('Network error');
          if (attempt < maxRetries) continue;
        }
      }

      throw { status: 500, message: lastError?.message || 'AI Gateway failed after retries' };
    };

    let data;
    try {
      data = await fetchAIWithRetry();
    } catch (apiError: any) {
      return new Response(
        JSON.stringify({ error: apiError.message || 'Erro ao gerar looks' }),
        { status: apiError.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Resposta inválida da IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Falha ao processar sugestões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enrich looks with item details and calculate real chromatic score
    const enrichedLooks = result.looks.map((look: any) => {
      const lookItems = look.items
        .map((id: string) => items.find(item => item.id === id))
        .filter(Boolean);
      
      // Calculate real chromatic score based on actual items
      const scores = lookItems.map((item: any) => {
        switch (item.chromatic_compatibility) {
          case 'ideal': return 100;
          case 'neutral': return 50;
          case 'avoid': return 0;
          default: return 25;
        }
      });
      const realScore = scores.length > 0 
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0;
      
      return {
        ...look,
        chromatic_score: realScore,
        items: lookItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          image_url: item.image_url,
          chromatic_compatibility: item.chromatic_compatibility
        }))
      };
    });

    // Sort by chromatic score (best first)
    enrichedLooks.sort((a: any, b: any) => (b.chromatic_score || 0) - (a.chromatic_score || 0));

    console.log(`Generated ${enrichedLooks.length} looks successfully`);

    // Cache the result
    await supabase.from('recommended_looks').insert({
      user_id: user.id,
      occasion: occasion || 'mixed',
      look_data: { looks: enrichedLooks }
    });

    return new Response(
      JSON.stringify({ looks: enrichedLooks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-looks:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
