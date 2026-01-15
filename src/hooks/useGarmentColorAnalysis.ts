import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateCompatibility } from '@/lib/chromatic-match';
import { useToast } from '@/hooks/use-toast';

interface DominantColor {
  hex: string;
  name: string;
  percentage: number;
}

interface GarmentColorResult {
  dominant_colors: DominantColor[];
  overall_tone: 'warm' | 'cool' | 'neutral';
  saturation: 'vivid' | 'muted' | 'neutral';
  brightness: 'light' | 'medium' | 'dark';
}

export function useGarmentColorAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const analyzeGarment = useCallback(async (imageBase64: string): Promise<GarmentColorResult | null> => {
    setIsAnalyzing(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const { data, error } = await supabase.functions.invoke('analyze-garment-colors', {
        body: { imageBase64 },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      return data as GarmentColorResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao analisar cores';
      toast({
        title: 'Erro na análise',
        description: message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const updateItemCompatibility = useCallback(async (
    itemId: string,
    dominantColors: DominantColor[]
  ) => {
    if (!user) return;

    try {
      // Get user's color analysis
      const { data: profile } = await supabase
        .from('profiles')
        .select('color_analysis')
        .eq('user_id', user.id)
        .single();

      const colorAnalysis = profile?.color_analysis as any;
      const compatibility = calculateCompatibility(dominantColors, colorAnalysis);

      // Update the wardrobe item - cast to any for JSONB compatibility
      await supabase
        .from('wardrobe_items')
        .update({
          dominant_colors: JSON.parse(JSON.stringify(dominantColors)),
          chromatic_compatibility: compatibility
        } as any)
        .eq('id', itemId);

      return compatibility;
    } catch (err) {
      console.error('Error updating item compatibility:', err);
      return 'unknown';
    }
  }, [user]);

  const recalculateAllCompatibilities = useCallback(async () => {
    if (!user) return;

    try {
      // Get user's color analysis
      const { data: profile } = await supabase
        .from('profiles')
        .select('color_analysis')
        .eq('user_id', user.id)
        .single();

      const colorAnalysis = profile?.color_analysis as any;
      if (!colorAnalysis) return;

      // Get all items with analyzed colors
      const { data: items } = await supabase
        .from('wardrobe_items')
        .select('id, dominant_colors')
        .eq('user_id', user.id)
        .not('dominant_colors', 'is', null);

      if (!items) return;

      // Update each item's compatibility
      for (const item of items) {
        const dominantColors = item.dominant_colors as unknown as DominantColor[];
        const compatibility = calculateCompatibility(dominantColors, colorAnalysis);

        await supabase
          .from('wardrobe_items')
          .update({ chromatic_compatibility: compatibility })
          .eq('id', item.id);
      }

      toast({
        title: 'Compatibilidades atualizadas',
        description: `${items.length} peças recalculadas com sua nova paleta.`
      });
    } catch (err) {
      console.error('Error recalculating compatibilities:', err);
    }
  }, [user, toast]);

  return {
    isAnalyzing,
    analyzeGarment,
    updateItemCompatibility,
    recalculateAllCompatibilities
  };
}
