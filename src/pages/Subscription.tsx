import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Crown, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { PricingCard } from '@/components/subscription/PricingCard';
import { UsageIndicator } from '@/components/subscription/UsageIndicator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription, PlanLimit } from '@/contexts/SubscriptionContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Subscription() {
  const { plan: currentPlan, currentPlanId, demoPlanId, setDemoPlan, allPlans } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Fetch all plan limits for display
  const { data: allLimits = [] } = useQuery({
    queryKey: ['all-plan-limits'],
    queryFn: async () => {
      const { data } = await supabase.from('plan_limits').select('*').order('feature_key');
      return (data || []) as PlanLimit[];
    },
  });

  // Group limits by plan
  const getLimitsForPlan = (planId: string) => {
    return allLimits.filter((l) => l.plan_id === planId);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // In a real app, this would trigger a payment flow
  };

  return (
    <>
      <Header title="Assinatura" />
      <PageContainer className="px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Current Plan Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge
              className="text-sm px-4 py-1"
              style={{ backgroundColor: currentPlan?.badge_color, color: 'white' }}
            >
              <Crown className="w-3.5 h-3.5 mr-1.5" />
              {currentPlan?.display_name || 'Free'}
            </Badge>
            <h1 className="font-display text-3xl mt-4 mb-2">Escolha seu plano</h1>
            <p className="text-muted-foreground">Desbloqueie recursos premium para sua experiência de moda</p>
          </motion.div>

          {/* Current Usage Overview */}
          <Card className="p-5 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Seu uso atual
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <UsageIndicator feature="wardrobe_slots" />
              <UsageIndicator feature="avatars" />
              <UsageIndicator feature="try_on_daily" />
            </div>
          </Card>

          {/* Demo Toggle */}
          <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Modo Demo: Visualize como seria com outro plano
                </p>
                <div className="flex gap-2 flex-wrap">
                  {allPlans.map((p) => (
                    <Button
                      key={p.id}
                      size="sm"
                      variant={currentPlanId === p.id ? 'default' : 'outline'}
                      onClick={() => setDemoPlan(currentPlanId === p.id && !demoPlanId ? null : p.id)}
                      className="text-xs"
                    >
                      {p.display_name}
                      {currentPlanId === p.id && demoPlanId === null && (
                        <Check className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                  ))}
                  {demoPlanId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDemoPlan(null)}
                      className="text-xs text-amber-700"
                    >
                      Resetar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {allPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PricingCard
                  plan={plan}
                  limits={getLimitsForPlan(plan.id)}
                  isCurrentPlan={currentPlanId === plan.id}
                  isPopular={plan.id === 'icon'}
                  onSelect={() => handleSelectPlan(plan.id)}
                />
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison */}
          <Card className="p-6">
            <h3 className="font-display text-lg mb-4">Comparativo de recursos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4">Recurso</th>
                    {allPlans.map((p) => (
                      <th
                        key={p.id}
                        className="text-center py-3 px-2"
                        style={{ color: p.badge_color }}
                      >
                        {p.display_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['avatars', 'wardrobe_slots', 'try_on_daily', 'trips', 'vip_looks'].map((featureKey) => {
                    const featureName = allLimits.find((l) => l.feature_key === featureKey)?.feature_display_name || featureKey;
                    return (
                      <tr key={featureKey} className="border-b border-border/50">
                        <td className="py-3 pr-4 text-muted-foreground">{featureName}</td>
                        {allPlans.map((plan) => {
                          const limit = allLimits.find(
                            (l) => l.plan_id === plan.id && l.feature_key === featureKey
                          );
                          const value = limit?.limit_value ?? 0;
                          const type = limit?.limit_type ?? 'count';

                          return (
                            <td key={plan.id} className="text-center py-3 px-2">
                              {type === 'boolean' ? (
                                value === 1 ? (
                                  <Check className="w-4 h-4 text-primary mx-auto" />
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )
                              ) : value === -1 ? (
                                <span className="font-medium text-primary">∞</span>
                              ) : (
                                <span className={value === 0 ? 'text-muted-foreground' : ''}>
                                  {value}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* FAQ or additional info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Dúvidas? Entre em contato com nosso suporte.</p>
            <p className="mt-1">Pagamentos processados de forma segura.</p>
          </div>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}
