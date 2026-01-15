import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  color_season: string | null;
  color_analysis: Json | null;
  style_archetype: string | null;
  style_preferences: Json | null;
  onboarding_complete: boolean | null;
  subscription_plan_id: string | null;
  subscription_expires_at: string | null;
  theme_preference: string | null;
  font_size: string | null;
  created_at: string;
  updated_at: string;
}

// Centralized profile hook with optimized caching
export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes in cache
  });

  // Helper to invalidate profile cache
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
  };

  // Derived data helpers
  const hasChromaticAnalysis = !!query.data?.color_analysis;
  const hasCompletedOnboarding = !!query.data?.onboarding_complete;
  const colorSeason = query.data?.color_season;

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    invalidate,
    // Derived helpers
    hasChromaticAnalysis,
    hasCompletedOnboarding,
    colorSeason,
  };
}

// Prefetch profile for navigation
export function usePrefetchProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetch = async () => {
    if (!user) return;
    
    await queryClient.prefetchQuery({
      queryKey: ['profile', user.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        return data;
      },
      staleTime: 1000 * 60 * 5,
    });
  };

  return { prefetch };
}
