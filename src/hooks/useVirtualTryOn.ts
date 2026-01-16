import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { prepareAvatarForTryOn, prepareGarmentForTryOn } from '@/lib/image-preprocessing';

interface TryOnResult {
  id: string;
  user_id: string;
  avatar_id: string | null;
  garment_source: string;
  garment_id: string | null;
  garment_image_url: string;
  result_image_url: string | null;
  status: string;
  processing_time_ms: number | null;
  error_message: string | null;
  created_at: string;
  model_used?: string | null;
  user_feedback?: string | null;
  feedback_at?: string | null;
  retry_count?: number | null;
}

interface UserAvatar {
  id: string;
  user_id: string;
  image_url: string;
  is_primary: boolean;
  body_type: string | null;
  created_at: string;
}

export function useVirtualTryOn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setRetryCountdown(null);
  }, []);

  const startCountdown = useCallback((seconds: number) => {
    clearCountdown();
    setRetryCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearCountdown();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearCountdown]);

  // Fetch user's primary avatar
  const { data: primaryAvatar, isLoading: isLoadingAvatar } = useQuery({
    queryKey: ['user-avatar', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_avatars')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserAvatar | null;
    },
    enabled: !!user,
  });

  // Fetch all user avatars
  const { data: avatars, isLoading: isLoadingAvatars } = useQuery({
    queryKey: ['user-avatars', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_avatars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserAvatar[];
    },
    enabled: !!user,
  });

  // Fetch try-on history
  const { data: tryOnHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['try-on-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('try_on_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as TryOnResult[];
    },
    enabled: !!user,
  });

  // Upload avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Check if user has any avatars
      const { data: existingAvatars } = await supabase
        .from('user_avatars')
        .select('id')
        .eq('user_id', user.id);

      const isFirst = !existingAvatars || existingAvatars.length === 0;

      const { data, error } = await supabase
        .from('user_avatars')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          is_primary: isFirst,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-avatars', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-avatar', user?.id] });
      toast.success('Avatar carregado com sucesso!');
    },
    onError: (error) => {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao carregar avatar');
    },
  });

  // Set primary avatar - two-step update to ensure only one primary
  const setPrimaryAvatarMutation = useMutation({
    mutationFn: async (avatarId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Step 1: Set all user's avatars as non-primary
      const { error: resetError } = await supabase
        .from('user_avatars')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      if (resetError) throw resetError;

      // Step 2: Set the selected avatar as primary
      const { error: setError } = await supabase
        .from('user_avatars')
        .update({ is_primary: true })
        .eq('id', avatarId)
        .eq('user_id', user.id);

      if (setError) throw setError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-avatars', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-avatar', user?.id] });
      toast.success('Avatar principal atualizado');
    },
  });

  // Submit feedback for a try-on result
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ resultId, feedback }: { resultId: string; feedback: 'like' | 'dislike' }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('try_on_results')
        .update({
          user_feedback: feedback,
          feedback_at: new Date().toISOString(),
        })
        .eq('id', resultId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: (_, { feedback }) => {
      queryClient.invalidateQueries({ queryKey: ['try-on-history'] });
      toast.success(feedback === 'like' ? 'Obrigado pelo feedback positivo!' : 'Vamos melhorar na próxima!');
    },
    onError: (error) => {
      console.error('Error submitting feedback:', error);
      toast.error('Erro ao enviar feedback');
    },
  });

  // Upload preprocessed image to temporary storage
  const uploadTempImage = async (blob: Blob, prefix: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    
    const fileName = `temp/${user.id}/${prefix}-${Date.now()}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { 
        contentType: 'image/jpeg',
        upsert: true 
      });

    if (uploadError) {
      console.error('Temp image upload error:', uploadError);
      throw new Error('Falha ao preparar imagem');
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Start virtual try-on
  const startTryOnMutation = useMutation({
    mutationFn: async ({
      garmentImageUrl,
      garmentSource,
      garmentId,
      category,
      retryCount = 0,
      strategy = 'race', // 'cascade' | 'race' | 'onboarding'
    }: {
      garmentImageUrl: string;
      garmentSource: 'wardrobe' | 'external_photo' | 'screenshot';
      garmentId?: string;
      category?: string;
      retryCount?: number;
      strategy?: 'cascade' | 'race' | 'onboarding';
    }) => {
      if (!user) throw new Error('Not authenticated');
      if (!primaryAvatar) throw new Error('No avatar configured');

      setIsProcessing(true);

      // Preprocess images for better model success rate
      let processedAvatarUrl = primaryAvatar.image_url;
      let processedGarmentUrl = garmentImageUrl;

      try {
        console.log('Preprocessing avatar image...');
        const avatarBlob = await prepareAvatarForTryOn(primaryAvatar.image_url);
        processedAvatarUrl = await uploadTempImage(avatarBlob, 'avatar');
        console.log('Avatar preprocessed and uploaded:', processedAvatarUrl);
      } catch (preprocessError) {
        console.warn('Avatar preprocessing failed, using original:', preprocessError);
        // Continue with original image if preprocessing fails
      }

      try {
        console.log('Preprocessing garment image...');
        const garmentBlob = await prepareGarmentForTryOn(garmentImageUrl);
        processedGarmentUrl = await uploadTempImage(garmentBlob, 'garment');
        console.log('Garment preprocessed and uploaded:', processedGarmentUrl);
      } catch (preprocessError) {
        console.warn('Garment preprocessing failed, using original:', preprocessError);
        // Continue with original image if preprocessing fails
      }

      // Create a pending try-on result
      const { data: tryOnResult, error: insertError } = await supabase
        .from('try_on_results')
        .insert({
          user_id: user.id,
          avatar_id: primaryAvatar.id,
          garment_source: garmentSource,
          garment_id: garmentId,
          garment_image_url: garmentImageUrl,
          status: 'pending',
          retry_count: retryCount,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call the edge function with preprocessed images
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      console.log(`Starting virtual try-on with strategy: ${strategy}`);
      
      const response = await supabase.functions.invoke('virtual-try-on', {
        body: {
          avatarImageUrl: processedAvatarUrl,
          garmentImageUrl: processedGarmentUrl,
          category: category || 'upper_body',
          tryOnResultId: tryOnResult.id,
          retryCount,
          strategy, // Pass strategy to edge function
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

       if (response.error) {
         const rawMessage = response.error.message || 'Falha ao processar prova virtual.';

         // Try to extract {"error":"...","retryAfterSeconds":N} from edge-function message
         let userMessage = rawMessage;
         let retryAfterSeconds: number | null = null;
         try {
           const jsonStart = rawMessage.indexOf('{');
           if (jsonStart !== -1) {
             const maybeJson = rawMessage.slice(jsonStart);
             const parsed = JSON.parse(maybeJson);
             if (parsed?.error) userMessage = String(parsed.error);
             if (typeof parsed?.retryAfterSeconds === 'number') retryAfterSeconds = parsed.retryAfterSeconds;
           }
         } catch {
           // ignore parse errors
         }

         if (retryAfterSeconds) {
           userMessage = `${userMessage}`;
         }

         // Update status to failed with a clean message
         await supabase
           .from('try_on_results')
           .update({
             status: 'failed',
             error_message: userMessage,
           })
           .eq('id', tryOnResult.id);

         throw new Error(userMessage);
       }

      return {
        ...tryOnResult,
        result_image_url: response.data.resultImageUrl,
        status: 'completed',
        processing_time_ms: response.data.processingTimeMs,
        model_used: response.data.model,
        retry_count: response.data.retryCount,
      };
    },
    onSuccess: () => {
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ['try-on-history'] });
      toast.success('Prova virtual concluída!');
    },
     onError: (error) => {
       setIsProcessing(false);
       console.error('Virtual try-on error:', error);
       const errorMsg = error instanceof Error ? error.message : 'Erro na prova virtual. Tente novamente.';

       // Check if it's a rate limit error with retry info
       const retryMatch = errorMsg.match(/Aguarde ~?(\d+)s/i);
       if (retryMatch) {
         const seconds = parseInt(retryMatch[1], 10);
         if (seconds > 0 && seconds <= 120) {
           startCountdown(seconds);
           toast.error(`Limite atingido. Tente novamente em ${seconds}s.`);
           return;
         }
       }

       toast.error(errorMsg);
     },
  });

  // Delete try-on result
  const deleteTryOnResultMutation = useMutation({
    mutationFn: async (resultId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('try_on_results')
        .delete()
        .eq('id', resultId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['try-on-history', user?.id] });
      toast.success('Resultado removido');
    },
    onError: (error) => {
      console.error('Error deleting try-on result:', error);
      toast.error('Erro ao remover resultado');
    },
  });

  return {
    primaryAvatar,
    avatars,
    tryOnHistory,
    isLoadingAvatar,
    isLoadingAvatars,
    isLoadingHistory,
    isProcessing,
    retryCountdown,
    uploadAvatar: uploadAvatarMutation.mutate,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    setPrimaryAvatar: setPrimaryAvatarMutation.mutate,
    startTryOn: startTryOnMutation.mutate,
    startTryOnAsync: startTryOnMutation.mutateAsync,
    deleteTryOnResult: deleteTryOnResultMutation.mutate,
    isDeletingResult: deleteTryOnResultMutation.isPending,
    submitFeedback: submitFeedbackMutation.mutate,
    isSubmittingFeedback: submitFeedbackMutation.isPending,
  };
}
