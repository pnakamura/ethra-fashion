import { useState } from 'react';
import { Crown, Save, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SubscriptionPlan, PlanLimit } from '@/contexts/SubscriptionContext';

const featureKeys = ['avatars', 'wardrobe_slots', 'try_on_daily', 'trips', 'vip_looks'];
const featureLabels: Record<string, string> = {
  avatars: 'Avatares',
  wardrobe_slots: 'Peças no Closet',
  try_on_daily: 'Provas/dia',
  trips: 'Viagens',
  vip_looks: 'Looks VIP',
};

export function SubscriptionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedLimits, setEditedLimits] = useState<Record<string, Record<string, number>>>({});
  const [manualUserId, setManualUserId] = useState('');
  const [manualPlanId, setManualPlanId] = useState('');

  // Fetch plans with limits
  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order');
      return (data || []) as SubscriptionPlan[];
    },
  });

  // Fetch all limits
  const { data: limits = [] } = useQuery({
    queryKey: ['admin-limits'],
    queryFn: async () => {
      const { data } = await supabase.from('plan_limits').select('*');
      return (data || []) as PlanLimit[];
    },
  });

  // Fetch subscriber counts
  const { data: subscriberCounts = {} } = useQuery({
    queryKey: ['admin-subscriber-counts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_plan_id');

      const counts: Record<string, number> = {};
      (data || []).forEach((p) => {
        const plan = p.subscription_plan_id || 'free';
        counts[plan] = (counts[plan] || 0) + 1;
      });
      return counts;
    },
  });

  // Update limit mutation
  const updateLimitMutation = useMutation({
    mutationFn: async ({ planId, featureKey, value }: { planId: string; featureKey: string; value: number }) => {
      const { error } = await supabase
        .from('plan_limits')
        .update({ limit_value: value })
        .eq('plan_id', planId)
        .eq('feature_key', featureKey);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-limits'] });
      queryClient.invalidateQueries({ queryKey: ['plan-limits'] });
      toast({ title: 'Limite atualizado!' });
    },
  });

  // Assign subscription mutation
  const assignSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_plan_id: planId })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriber-counts'] });
      toast({ title: 'Assinatura atribuída!' });
      setManualUserId('');
      setManualPlanId('');
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Usuário não encontrado', variant: 'destructive' });
    },
  });

  const getLimitValue = (planId: string, featureKey: string) => {
    if (editedLimits[planId]?.[featureKey] !== undefined) {
      return editedLimits[planId][featureKey];
    }
    const limit = limits.find((l) => l.plan_id === planId && l.feature_key === featureKey);
    return limit?.limit_value ?? 0;
  };

  const handleLimitChange = (planId: string, featureKey: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    setEditedLimits((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [featureKey]: numValue,
      },
    }));
  };

  const handleSaveChanges = async () => {
    const updates: Promise<void>[] = [];

    Object.entries(editedLimits).forEach(([planId, features]) => {
      Object.entries(features).forEach(([featureKey, value]) => {
        updates.push(
          updateLimitMutation.mutateAsync({ planId, featureKey, value })
        );
      });
    });

    await Promise.all(updates);
    setEditedLimits({});
  };

  const hasChanges = Object.keys(editedLimits).length > 0;

  return (
    <div className="space-y-6">
      {/* Stats por Plano */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-4 text-center">
            <Badge style={{ backgroundColor: plan.badge_color, color: 'white' }}>
              {plan.display_name}
            </Badge>
            <p className="text-3xl font-bold mt-2">{subscriberCounts[plan.id] || 0}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Users className="w-3 h-3" /> assinantes
            </p>
          </Card>
        ))}
      </div>

      {/* Editor de Limites */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Configurar Limites</h3>
          {hasChanges && (
            <Button onClick={handleSaveChanges} size="sm" className="gradient-primary">
              <Save className="w-4 h-4 mr-1.5" /> Salvar
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                {plans.map((p) => (
                  <TableHead key={p.id} className="text-center" style={{ color: p.badge_color }}>
                    {p.display_name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{featureLabels[key]}</TableCell>
                  {plans.map((p) => (
                    <TableCell key={p.id} className="text-center">
                      <Input
                        type="number"
                        value={getLimitValue(p.id, key)}
                        onChange={(e) => handleLimitChange(p.id, key, e.target.value)}
                        className="w-20 mx-auto text-center"
                        min={-1}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {getLimitValue(p.id, key) === -1 ? '∞' : ''}
                      </p>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Use <code className="bg-muted px-1 rounded">-1</code> para ilimitado, <code className="bg-muted px-1 rounded">0</code> para bloqueado, <code className="bg-muted px-1 rounded">1</code> para liberado (booleano).
        </p>
      </Card>

      {/* Atribuição Manual */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Atribuir Assinatura Manual</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="ID do usuário (UUID)"
            value={manualUserId}
            onChange={(e) => setManualUserId(e.target.value)}
            className="flex-1"
          />
          <Select value={manualPlanId} onValueChange={setManualPlanId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() =>
              manualUserId &&
              manualPlanId &&
              assignSubscriptionMutation.mutate({ userId: manualUserId, planId: manualPlanId })
            }
            disabled={!manualUserId || !manualPlanId || assignSubscriptionMutation.isPending}
          >
            Atribuir
          </Button>
        </div>
      </Card>
    </div>
  );
}
