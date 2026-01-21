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

  console.log('suggest-vip-looks request', {
    method: req.method,
    hasAuth: !!(req.headers.get('authorization') ?? req.headers.get('Authorization')),
  });

  try {
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : authHeader.trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Validate JWT
    const authClient = createClient(supabaseUrl, supabaseServiceRoleKey ?? supabaseAnonKey);
    const { data: userData, error: authError } = await authClient.auth.getUser(token);
    const user = userData?.user ?? null;

    if (authError || !user) {
      console.error('suggest-vip-looks auth failed', { authError: authError?.message });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use an authed client for DB operations
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { count = 3 } = await req.json();

    console.log(`Generating ${count} VIP looks for user ${user.id}`);

    // Fetch user's chromatic profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('color_season, color_analysis, subscription_plan_id')
      .eq('user_id', user.id)
      .single();

    // Fetch user's wardrobe items (prioritize ideal compatibility)
    const { data: items } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', user.id)
      .order('chromatic_compatibility', { ascending: true });

    if (!items || items.length < 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Guarda-roupa insuficiente',
          message: 'Adicione pelo menos 3 peças para receber looks VIP exclusivos.'
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
      return `- ID: ${item.id} | ${item.category} | Cores: ${colors} | Compat: ${item.chromatic_compatibility || 'unknown'}`;
    }).join('\n');

    const colorAnalysis = profile?.color_analysis as any;
    const chromaticContext = colorAnalysis ? `
## PERFIL CROMÁTICO VIP
Estação: ${colorAnalysis.season} ${colorAnalysis.subtype || ''}
Cores ideais: ${colorAnalysis.recommended_colors?.slice(0, 8).join(', ') || 'não definidas'}
Cores a evitar: ${colorAnalysis.avoid_colors?.slice(0, 5).join(', ') || 'não definidas'}
Tom de pele: ${colorAnalysis.skin_tone || 'não definido'}
Subtom: ${colorAnalysis.undertone || 'não definido'}
` : 'Análise cromática não disponível.';

    // VIP-specific elite prompt
    const prompt = `Você é **Aura Elite**, uma consultora de estilo de celebridades especializada em looks de alto impacto e tendências de passarela. Seu trabalho é criar looks que fariam a cliente se sentir uma verdadeira estrela.

${chromaticContext}

## GUARDA-ROUPA DISPONÍVEL
${wardrobeDescription}

## MISSÃO VIP
Crie exatamente ${count} looks EXCLUSIVOS e MEMORÁVEIS usando APENAS peças do guarda-roupa acima. Cada look deve ser único, ousado e fotografável.

## CRITÉRIOS VIP OBRIGATÓRIOS
1. **Priorize harmonias cromáticas avançadas**:
   - Tríade: 3 cores equidistantes no círculo cromático
   - Complementar Dividida: uma cor + duas adjacentes à complementar
   - Tetrádica: 4 cores formando um retângulo no círculo
   
2. **Inspiração de tendências**: Mencione uma tendência atual (ex: Quiet Luxury, Old Money, Coastal Grandmother, Dopamine Dressing, Y2K Revival)

3. **Nomes glamorosos**: Use nomes criativos e sofisticados em português

4. **Frase de confiança**: Uma afirmação empoderada personalizada para cada look

5. **Sugestões de acessórios premium**: 2-3 acessórios que elevariam o look

6. **Classificação VIP**:
   - GOLD: Score cromático 90-100, harmonia perfeita, peças ideais
   - SILVER: Score 75-89, excelente combinação
   - BRONZE: Score 60-74, muito bom

## REGRAS
1. Use APENAS peças com compatibilidade "ideal" ou "neutral"
2. NUNCA use peças com compatibilidade "avoid"
3. Cada look: 2-4 peças que funcionem magnificamente juntas
4. Score = média (ideal=100, neutral=50, avoid=0)

Retorne APENAS JSON válido (sem markdown):
{
  "looks": [
    {
      "name": "Nome glamoroso e memorável",
      "items": ["uuid1", "uuid2"],
      "occasion": "evento|gala|date|photoshoot",
      "harmony_type": "tríade|complementar_dividida|tetrádica|análoga",
      "color_harmony": "Explicação da harmonia usando teoria avançada das cores",
      "chromatic_score": 95,
      "styling_tip": "Dica de styling refinada",
      "trend_inspiration": "Nome da tendência atual",
      "confidence_boost": "Frase empoderada e motivacional",
      "accessory_suggestions": ["acessório 1", "acessório 2"],
      "vip_tier": "gold|silver|bronze"
    }
  ]
}`;

    // Helper function with retry
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
              max_tokens: 3000,
              temperature: 0.8, // Slightly higher for more creative VIP looks
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('AI gateway error:', response.status, errorText);

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

            throw { status: 500, message: 'Erro ao gerar looks VIP' };
          }

          const data = await response.json();

          if (data.error?.code === 500 || data.error?.message?.includes('Internal')) {
            lastError = new Error(`AI Gateway internal error: ${data.error.message}`);
            continue;
          }

          return data;
        } catch (fetchError: any) {
          if (fetchError.status) throw fetchError;
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
        JSON.stringify({ error: apiError.message || 'Erro ao gerar looks VIP' }),
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
        JSON.stringify({ error: 'Falha ao processar sugestões VIP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enrich looks with item details and calculate real chromatic score
    const enrichedLooks = result.looks.map((look: any) => {
      const lookItems = look.items
        .map((id: string) => items.find(item => item.id === id))
        .filter(Boolean);
      
      // Calculate real chromatic score
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

      // Determine VIP tier based on real score
      let vipTier = 'bronze';
      if (realScore >= 90) vipTier = 'gold';
      else if (realScore >= 75) vipTier = 'silver';
      
      return {
        ...look,
        chromatic_score: realScore,
        vip_tier: vipTier,
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

    console.log(`Generated ${enrichedLooks.length} VIP looks successfully`);

    // Cache the result with 'vip' occasion tag
    await supabase.from('recommended_looks').insert({
      user_id: user.id,
      occasion: 'vip',
      look_data: { looks: enrichedLooks }
    });

    return new Response(
      JSON.stringify({ looks: enrichedLooks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-vip-looks:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
