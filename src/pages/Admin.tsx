import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Crown,
  Settings,
  Shield,
  TrendingUp,
  Shirt,
  Palette,
  BarChart3,
  Key,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { UserManagement } from '@/components/admin/UserManagement';
import { SubscriptionManagement } from '@/components/admin/SubscriptionManagement';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color?: string;
}

function StatCard({ icon: Icon, label, value, color = 'text-primary' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-primary/10 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function AdminSetup() {
  const [secretKey, setSecretKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setupFirstAdmin } = useAdmin();

  const handleSetup = async () => {
    setIsSubmitting(true);
    await setupFirstAdmin(secretKey);
    setIsSubmitting(false);
    setSecretKey('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Configurar Admin</h2>
          <p className="text-sm text-muted-foreground">
            Insira a chave secreta para se tornar o primeiro administrador
          </p>
        </div>

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Chave secreta"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />
          <Button
            onClick={handleSetup}
            disabled={!secretKey || isSubmitting}
            className="w-full gradient-primary"
          >
            {isSubmitting ? 'Configurando...' : 'Tornar-me Admin'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, items, outfits, subscribers] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('wardrobe_items').select('*', { count: 'exact', head: true }),
        supabase.from('outfits').select('*', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .neq('subscription_plan_id', 'free'),
      ]);

      return {
        totalUsers: users.count || 0,
        totalItems: items.count || 0,
        totalOutfits: outfits.count || 0,
        subscribers: subscribers.count || 0,
      };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold">Painel Admin</h1>
              <p className="text-sm text-muted-foreground">Ethra Fashion</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard icon={Users} label="Usuários" value={stats?.totalUsers || 0} />
          <StatCard icon={Shirt} label="Peças" value={stats?.totalItems || 0} />
          <StatCard icon={Palette} label="Looks Criados" value={stats?.totalOutfits || 0} />
          <StatCard icon={Crown} label="Assinantes" value={stats?.subscribers || 0} />
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="users" className="text-xs sm:text-sm">
              <Users className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">
              <Crown className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">
              <Settings className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Analytics</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Em breve: Gráficos de crescimento, engagement e métricas do app.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Configurações</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Em breve: Configurações gerais do aplicativo.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Admin() {
  const { isAdmin, isLoading } = useAdmin();

  // Show setup page if not admin yet (for first admin setup)
  if (!isLoading && !isAdmin) {
    return <AdminSetup />;
  }

  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
