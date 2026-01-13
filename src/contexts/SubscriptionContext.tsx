import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SubscriptionPlan {
  id: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  badge_color: string;
  is_active: boolean;
  sort_order: number;
}

export interface PlanLimit {
  id: string;
  plan_id: string;
  feature_key: string;
  limit_type: 'count' | 'boolean' | 'tier';
  limit_value: number;
  feature_display_name: string | null;
}

interface SubscriptionContextType {
  plan: SubscriptionPlan | null;
  limits: Map<string, PlanLimit>;
  allPlans: SubscriptionPlan[];
  isLoading: boolean;
  currentPlanId: string;
  demoPlanId: string | null;
  setDemoPlan: (planId: string | null) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [demoPlanId, setDemoPlanId] = useState<string | null>(null);

  // Fetch user's subscription plan
  const { data: userPlanId, isLoading: isLoadingUserPlan } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return 'free';
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan_id')
        .eq('user_id', user.id)
        .single();
      if (error) return 'free';
      return data?.subscription_plan_id || 'free';
    },
    enabled: !!user,
  });

  // Fetch all plans
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return (data || []) as SubscriptionPlan[];
    },
  });

  // Fetch all limits
  const { data: allLimits = [], isLoading: isLoadingLimits } = useQuery({
    queryKey: ['plan-limits'],
    queryFn: async () => {
      const { data } = await supabase
        .from('plan_limits')
        .select('*');
      return (data || []) as PlanLimit[];
    },
  });

  const activePlanId = demoPlanId || userPlanId || 'free';

  // Create Map of limits for current plan
  const limits = useMemo(() => {
    const map = new Map<string, PlanLimit>();
    allLimits
      .filter((l) => l.plan_id === activePlanId)
      .forEach((l) => map.set(l.feature_key, l));
    return map;
  }, [allLimits, activePlanId]);

  const currentPlan = plans.find((p) => p.id === activePlanId) || null;
  const isLoading = isLoadingUserPlan || isLoadingPlans || isLoadingLimits;

  return (
    <SubscriptionContext.Provider
      value={{
        plan: currentPlan,
        limits,
        allPlans: plans,
        currentPlanId: activePlanId,
        demoPlanId,
        setDemoPlan: setDemoPlanId,
        isLoading,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
