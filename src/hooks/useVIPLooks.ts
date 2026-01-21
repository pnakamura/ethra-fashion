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

export interface VIPLook {
  name: string;
  items: LookItem[];
  occasion: string;
  harmony_type: string;
  color_harmony: string;
  chromatic_score: number;
  styling_tip: string;
  trend_inspiration: string;
  confidence_boost: string;
  accessory_suggestions: string[];
  vip_tier: 'gold' | 'silver' | 'bronze';
}

export function useVIPLooks() {
  const [vipLooks, setVIPLooks] = useState<VIPLook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateVIPLooks = useCallback(async (count = 3) => {
    setIsLoading(true);
    setError(null);

    try {
      // Ensure session is fresh
      await supabase.auth.refreshSession();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const invokeOnce = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        
        const { data, error: fnError } = await supabase.functions.invoke('suggest-vip-looks', {
          body: { count },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (fnError) throw new Error(fnError.message);
        return data;
      };

      let data;
      try {
        data = await invokeOnce();
      } catch (e) {
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

      const looks = data.looks || [];
      setVIPLooks(looks);
      return looks;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar looks VIP';
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

  const loadCachedVIPLooks = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('recommended_looks')
        .select('*')
        .eq('occasion', 'vip')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.look_data) {
        const lookData = data.look_data as unknown as { looks: VIPLook[] };
        const looks = lookData.looks || [];
        setVIPLooks(looks);
        return looks;
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const reset = useCallback(() => {
    setVIPLooks([]);
    setError(null);
  }, []);

  return {
    vipLooks,
    isLoading,
    error,
    generateVIPLooks,
    loadCachedVIPLooks,
    reset
  };
}
