import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ColorAnalysisResult {
  season_id: string;
  season_name: string;
  subtype: string;
  confidence: number;
  explanation: string;
  skin_tone: string;
  eye_color: string;
  hair_color: string;
  recommended_colors: Array<{ hex: string; name: string }>;
  avoid_colors: Array<{ hex: string; name: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
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

    console.log('Starting color analysis with AI...');

    const systemPrompt = `Você é uma consultora de colorimetria pessoal especializada no sistema das 12 estações sazonais. 
Analise a foto da pessoa e determine sua estação cromática mais provável.

As 12 estações são:
- Primavera Clara (spring-light): tons claros e quentes
- Primavera Quente (spring-warm): tons vibrantes e quentes  
- Primavera Brilhante (spring-bright): alto contraste e cores vivas quentes
- Verão Claro (summer-light): tons suaves e frios
- Verão Suave (summer-soft): tons acinzentados e suaves
- Verão Frio (summer-cool): tons frios com profundidade média
- Outono Suave (autumn-soft): tons terrosos suaves
- Outono Quente (autumn-warm): tons terrosos ricos e quentes
- Outono Profundo (autumn-deep): tons escuros e quentes
- Inverno Frio (winter-cool): tons frios com alto contraste
- Inverno Profundo (winter-deep): tons escuros e frios
- Inverno Brilhante (winter-bright): alto contraste com cores vivas frias

Analise:
1. Tom de pele (subtom quente/frio, claro/médio/escuro)
2. Cor dos olhos
3. Cor do cabelo (considere a cor natural)
4. Contraste geral entre pele, olhos e cabelo`;

    const userPrompt = `Analise esta foto e determine a estação cromática da pessoa. Seja precisa e forneça uma explicação detalhada do porquê.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: image_base64.startsWith('data:') ? image_base64 : `data:image/jpeg;base64,${image_base64}` 
                } 
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_color_analysis',
              description: 'Provide the complete color analysis result for the person in the image',
              parameters: {
                type: 'object',
                properties: {
                  season_id: { 
                    type: 'string', 
                    enum: [
                      'spring-light', 'spring-warm', 'spring-bright',
                      'summer-light', 'summer-soft', 'summer-cool',
                      'autumn-soft', 'autumn-warm', 'autumn-deep',
                      'winter-cool', 'winter-deep', 'winter-bright'
                    ],
                    description: 'The ID of the color season'
                  },
                  season_name: { type: 'string', description: 'Name of the season in Portuguese (e.g., Primavera, Verão, Outono, Inverno)' },
                  subtype: { type: 'string', description: 'Subtype in Portuguese (e.g., Clara, Quente, Suave, Profundo, Brilhante, Frio)' },
                  confidence: { type: 'number', description: 'Confidence level 0-100' },
                  explanation: { type: 'string', description: 'Detailed explanation in Portuguese of why this season was chosen' },
                  skin_tone: { type: 'string', description: 'Description of skin tone in Portuguese' },
                  eye_color: { type: 'string', description: 'Description of eye color in Portuguese' },
                  hair_color: { type: 'string', description: 'Description of hair color in Portuguese' },
                  recommended_colors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        hex: { type: 'string', description: 'Hex color code' },
                        name: { type: 'string', description: 'Color name in Portuguese' }
                      },
                      required: ['hex', 'name']
                    },
                    description: '6 recommended colors that will look great on this person'
                  },
                  avoid_colors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        hex: { type: 'string', description: 'Hex color code' },
                        name: { type: 'string', description: 'Color name in Portuguese' }
                      },
                      required: ['hex', 'name']
                    },
                    description: '3 colors to avoid'
                  }
                },
                required: ['season_id', 'season_name', 'subtype', 'confidence', 'explanation', 'skin_tone', 'eye_color', 'hair_color', 'recommended_colors', 'avoid_colors'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_color_analysis' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Muitas requisições. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Tente novamente mais tarde.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao processar análise' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Não foi possível analisar a imagem. Tente com outra foto.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisResult: ColorAnalysisResult = JSON.parse(toolCall.function.arguments);
    console.log('Analysis complete:', analysisResult.season_id, 'confidence:', analysisResult.confidence);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: {
          ...analysisResult,
          analyzed_at: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-colors:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});