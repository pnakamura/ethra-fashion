import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LookItem {
  id: string;
  name: string | null;
  category: string;
  image_url: string;
  chromatic_compatibility: string | null;
}

export interface RecommendedLook {
  name: string;
  items: LookItem[];
  occasion: string;
  color_harmony: string;
  styling_tip: string;
  harmony_type?: string; // complementar, análoga, tríade, monocromática
  chromatic_score?: number; // 0-100
}

export function useLookRecommendations() {
  const [looks, setLooks] = useState<RecommendedLook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Calculate chromatic score for a look
  const calculateChromaticScore = (items: LookItem[]): number => {
    if (items.length === 0) return 0;
    
    const scores = items.map(item => {
      switch (item.chromatic_compatibility) {
        case 'ideal': return 100;
        case 'neutral': return 50;
        case 'avoid': return 0;
        default: return 25; // unknown
      }
    });
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / items.length);
  };

  const generateLooks = useCallback(async (occasion?: string, count = 3) => {
    setIsLoading(true);
    setError(null);

    try {
      // Ensure session is fresh before calling backend function
      await supabase.auth.refreshSession();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const invokeOnce = async () => {
        const { data, error: fnError } = await supabase.functions.invoke('suggest-looks', {
          body: { occasion, count }
        });
        if (fnError) throw new Error(fnError.message);
        return data;
      };

      let data;
      try {
        data = await invokeOnce();
      } catch (e) {
        // If token was stale, refresh once and retry
        const msg = e instanceof Error ? e.message : '';
        if (msg.toLowerCase().includes('unauthorized') || msg.includes('401')) {
          await supabase.auth.refreshSession();
          data = await invokeOnce();
        } else {
          throw e;
        }
      }

      if (data.error) {
        if (data.message) {
          // Informational error (like insufficient items)
          setError(data.message);
          toast({
            title: 'Atenção',
            description: data.message,
            variant: 'default'
          });
        } else {
          throw new Error(data.error);
        }
        return [];
      }

      // Enrich looks with chromatic score
      const enrichedLooks = (data.looks || []).map((look: RecommendedLook) => ({
        ...look,
        chromatic_score: look.chromatic_score || calculateChromaticScore(look.items),
      }));

      // Sort by chromatic score (highest first)
      enrichedLooks.sort((a: RecommendedLook, b: RecommendedLook) => 
        (b.chromatic_score || 0) - (a.chromatic_score || 0)
      );

      setLooks(enrichedLooks);
      return enrichedLooks;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar looks';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadCachedLooks = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('recommended_looks')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.look_data) {
        const lookData = data.look_data as unknown as { looks: RecommendedLook[] };
        const enrichedLooks = (lookData.looks || []).map((look: RecommendedLook) => ({
          ...look,
          chromatic_score: look.chromatic_score || calculateChromaticScore(look.items),
        }));
        setLooks(enrichedLooks);
        return enrichedLooks;
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const reset = useCallback(() => {
    setLooks([]);
    setError(null);
  }, []);

  return {
    looks,
    isLoading,
    error,
    generateLooks,
    loadCachedLooks,
    reset
  };
}
