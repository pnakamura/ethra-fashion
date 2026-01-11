import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export interface TripWeatherResult {
  weather: WeatherData;
  recommendations: {
    essential_items: string[];
    suggested_looks: SuggestedLook[];
    tips: string[];
  };
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
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to analyze weather');
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      setData(result);
      return result;
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
