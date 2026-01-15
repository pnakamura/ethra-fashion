import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WeatherData {
  summary: string;
  climate_vibe: string;
  packing_mood: string;
  temp_avg: number;
  temp_min: number;
  temp_max: number;
  rain_probability: number;
  conditions: string[];
}

export interface SuggestedLook {
  name: string;
  occasion: string;
  items: string[];
  description: string;
  style_tip: string;
}

export interface TipsCategories {
  essentials: string[];
  local_culture: string[];
  avoid: string[];
  pro_tips: string[];
}

export interface PackingItem {
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

export interface PackingList {
  roupas: PackingItem[];
  calcados: PackingItem[];
  acessorios: PackingItem[];
  chapeus: PackingItem[];
}

export interface TripWeatherResult {
  weather: WeatherData;
  trip_brief: string;
  recommendations: {
    essential_items: string[];
    suggested_looks: SuggestedLook[];
    tips: TipsCategories;
  };
  packing_list?: PackingList;
}

interface UseTripWeatherResult {
  analyze: (params: {
    destination: string;
    startDate: string;
    endDate: string;
    tripType: string;
    userId?: string;
  }) => Promise<TripWeatherResult | null>;
  isLoading: boolean;
  error: string | null;
  data: TripWeatherResult | null;
  reset: () => void;
}

export function useTripWeather(): UseTripWeatherResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TripWeatherResult | null>(null);
  const { toast } = useToast();

  const analyze = async (params: {
    destination: string;
    startDate: string;
    endDate: string;
    tripType: string;
    userId?: string;
  }): Promise<TripWeatherResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'get-trip-weather',
        {
          body: {
            destination: params.destination,
            start_date: params.startDate,
            end_date: params.endDate,
            trip_type: params.tripType,
            user_id: params.userId,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to analyze weather');
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      // Ensure backward compatibility with old response format
      const normalizedResult: TripWeatherResult = {
        weather: {
          summary: result.weather?.summary || '',
          climate_vibe: result.weather?.climate_vibe || 'versatile_weather',
          packing_mood: result.weather?.packing_mood || 'Viaje com estilo!',
          temp_avg: result.weather?.temp_avg || 0,
          temp_min: result.weather?.temp_min || 0,
          temp_max: result.weather?.temp_max || 0,
          rain_probability: result.weather?.rain_probability || 0,
          conditions: result.weather?.conditions || [],
        },
        trip_brief: result.trip_brief || '',
        recommendations: {
          essential_items: result.recommendations?.essential_items || [],
          suggested_looks: (result.recommendations?.suggested_looks || []).map((look: Record<string, unknown>) => ({
            name: look.name || look.occasion || 'Look',
            occasion: look.occasion || '',
            items: look.items || [],
            description: look.description || '',
            style_tip: look.style_tip || '',
          })),
          tips: {
            essentials: result.recommendations?.tips?.essentials || 
              (Array.isArray(result.recommendations?.tips) ? result.recommendations.tips : []),
            local_culture: result.recommendations?.tips?.local_culture || [],
            avoid: result.recommendations?.tips?.avoid || [],
            pro_tips: result.recommendations?.tips?.pro_tips || [],
          },
        },
        packing_list: result.packing_list || undefined,
      };

      setData(normalizedResult);
      return normalizedResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao analisar clima';
      setError(message);
      
      if (message.includes('Rate limit')) {
        toast({
          title: 'Limite atingido',
          description: 'Muitas requisições. Tente novamente em alguns minutos.',
          variant: 'destructive',
        });
      } else if (message.includes('Payment')) {
        toast({
          title: 'Créditos insuficientes',
          description: 'Adicione créditos para continuar usando a análise climática.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro na análise',
          description: message,
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    analyze,
    isLoading,
    error,
    data,
    reset,
  };
}
