import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ColorAnalysisResult {
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
  analyzed_at: string;
}

export function useColorAnalysis() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ColorAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (imageBase64: string): Promise<ColorAnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-colors', {
        body: { image_base64: imageBase64 }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const analysisResult = data.analysis as ColorAnalysisResult;
      setResult(analysisResult);
      return analysisResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao analisar imagem';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToProfile = async (analysis: ColorAnalysisResult) => {
    if (!user) {
      toast.error('Você precisa estar logado para salvar');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          color_season: analysis.season_id,
          color_analysis: JSON.parse(JSON.stringify(analysis)),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Sua paleta foi salva!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar';
      toast.error(message);
      return false;
    }
  };

  const loadFromProfile = async (): Promise<ColorAnalysisResult | null> => {
    if (!user) return null;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('color_season, color_analysis')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.color_analysis) {
        const analysis = profile.color_analysis as unknown as ColorAnalysisResult;
        setResult(analysis);
        return analysis;
      }

      return null;
    } catch {
      return null;
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    isAnalyzing,
    result,
    error,
    analyzeImage,
    saveToProfile,
    loadFromProfile,
    reset,
  };
}