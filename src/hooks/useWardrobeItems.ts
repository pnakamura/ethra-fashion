import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  name: string | null;
  category: string;
  color_code: string | null;
  chromatic_compatibility: string | null;
  dominant_colors: Json | null;
  is_favorite: boolean | null;
  last_worn: string | null;
  occasion: string | null;
  season_tag: string | null;
  created_at: string;
}

interface UseWardrobeItemsOptions {
  enabled?: boolean;
}

// Centralized wardrobe items hook with optimized caching
export function useWardrobeItems(options: UseWardrobeItemsOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: ['wardrobe-items', user?.id],
    queryFn: async (): Promise<WardrobeItem[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching wardrobe items:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user && enabled,
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes in cache
  });

  // Helper to invalidate cache
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['wardrobe-items', user?.id] });
  };

  // Derived data - count from cached data
  const count = query.data?.length ?? 0;
  
  // Filter helpers
  const filterByCompatibility = (compatibility: string) => {
    return query.data?.filter(item => item.chromatic_compatibility === compatibility) ?? [];
  };

  const favorites = query.data?.filter(item => item.is_favorite) ?? [];

  const idealItems = filterByCompatibility('ideal');
  const neutralItems = filterByCompatibility('neutral');
  const avoidItems = filterByCompatibility('avoid');

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    invalidate,
    // Derived data
    count,
    favorites,
    idealItems,
    neutralItems,
    avoidItems,
    filterByCompatibility,
  };
}

// Prefetch wardrobe items for navigation
export function usePrefetchWardrobeItems() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetch = async () => {
    if (!user) return;
    
    await queryClient.prefetchQuery({
      queryKey: ['wardrobe-items', user.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('wardrobe_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        return data || [];
      },
      staleTime: 1000 * 60 * 3,
    });
  };

  return { prefetch };
}
