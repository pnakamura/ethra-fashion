import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PermissionResult {
  hasAccess: boolean;
  limit: number;
  currentUsage: number;
  remaining: number;
  isUnlimited: boolean;
  percentUsed: number;
  featureName: string;
  isLoading: boolean;
}

export function usePermission(featureKey: string): PermissionResult {
  const { limits } = useSubscription();
  const { user } = useAuth();

  // Fetch current usage based on feature
  const { data: currentUsage = 0, isLoading } = useQuery({
    queryKey: ['usage', featureKey, user?.id],
    queryFn: async () => {
      if (!user) return 0;

      switch (featureKey) {
        case 'avatars': {
          const { count } = await supabase
            .from('user_avatars')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          return count || 0;
        }

        case 'wardrobe_slots': {
          const { count } = await supabase
            .from('wardrobe_items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          return count || 0;
        }

        case 'try_on_daily': {
          const today = new Date().toISOString().split('T')[0];
          const { count } = await supabase
            .from('try_on_results')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', `${today}T00:00:00`);
          return count || 0;
        }

        default:
          return 0;
      }
    },
    enabled: !!user && ['avatars', 'wardrobe_slots', 'try_on_daily'].includes(featureKey),
    staleTime: 30000, // Cache for 30 seconds
  });

  const planLimit = limits.get(featureKey);
  const limitValue = planLimit?.limit_value ?? 0;
  const limitType = planLimit?.limit_type ?? 'count';

  const isUnlimited = limitValue === -1;
  
  // For boolean types, hasAccess is based on limit_value being 1
  // For count types, hasAccess is based on whether user is under limit
  const hasAccess = limitType === 'boolean'
    ? limitValue === 1
    : isUnlimited || currentUsage < limitValue;

  const remaining = isUnlimited ? Infinity : Math.max(0, limitValue - currentUsage);
  const percentUsed = isUnlimited ? 0 : limitValue > 0 ? (currentUsage / limitValue) * 100 : 0;

  return {
    hasAccess,
    limit: limitValue,
    currentUsage,
    remaining,
    isUnlimited,
    percentUsed,
    featureName: planLimit?.feature_display_name || featureKey,
    isLoading,
  };
}
