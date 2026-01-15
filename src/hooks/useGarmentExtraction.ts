import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ExternalGarment {
  id: string;
  user_id: string;
  source_type: string;
  original_image_url: string;
  processed_image_url: string | null;
  detected_category: string | null;
  source_url: string | null;
  name: string | null;
  created_at: string;
}

export function useGarmentExtraction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch extracted garments
  const { data: externalGarments, isLoading } = useQuery({
    queryKey: ['external-garments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('external_garments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ExternalGarment[];
    },
    enabled: !!user,
  });

  // Upload and extract garment from image
  const extractGarmentMutation = useMutation({
    mutationFn: async ({
      file,
      sourceType,
      sourceUrl,
    }: {
      file: File;
      sourceType: 'camera_scan' | 'screenshot' | 'url';
      sourceUrl?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upload the original image
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('external-garments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('external-garments')
        .getPublicUrl(fileName);

      // Call the extraction edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const response = await supabase.functions.invoke('extract-garment', {
        body: {
          imageUrl: publicUrl,
          sourceType,
          sourceUrl,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data.garment as ExternalGarment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-garments'] });
      toast.success('Peça extraída com sucesso!');
    },
    onError: (error) => {
      console.error('Error extracting garment:', error);
      toast.error('Erro ao extrair peça. Tente novamente.');
    },
  });

  // Extract garment from external URL (server-side fetch, no CORS)
  const extractFromUrlMutation = useMutation({
    mutationFn: async ({ url }: { url: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Call the extraction edge function with externalUrl
      // The edge function will fetch the image server-side (bypassing CORS)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const response = await supabase.functions.invoke('extract-garment', {
        body: {
          externalUrl: url,
          sourceType: 'url',
          sourceUrl: url,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Falha ao processar URL');
      }

      return response.data.garment as ExternalGarment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-garments'] });
      toast.success('Peça extraída com sucesso!');
    },
    onError: (error) => {
      console.error('Error extracting garment from URL:', error);
      const message = error instanceof Error ? error.message : 'Erro ao extrair peça';
      toast.error(message);
    },
  });

  // Delete external garment
  const deleteGarmentMutation = useMutation({
    mutationFn: async (garmentId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('external_garments')
        .delete()
        .eq('id', garmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-garments'] });
      toast.success('Peça removida');
    },
  });

  return {
    externalGarments,
    isLoading,
    extractGarment: extractGarmentMutation.mutate,
    extractGarmentAsync: extractGarmentMutation.mutateAsync,
    isExtracting: extractGarmentMutation.isPending || extractFromUrlMutation.isPending,
    extractFromUrl: extractFromUrlMutation.mutate,
    extractFromUrlAsync: extractFromUrlMutation.mutateAsync,
    deleteGarment: deleteGarmentMutation.mutate,
  };
}
