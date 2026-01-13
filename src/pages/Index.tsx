import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { LookOfTheDay } from '@/components/dashboard/LookOfTheDay';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { MissionCard } from '@/components/dashboard/MissionCard';
import { TemporarySeasonBanner } from '@/components/chromatic/TemporarySeasonBanner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: itemCount = 0 } = useQuery({
    queryKey: ['wardrobe-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('wardrobe_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/welcome');
      } else if (!profileLoading && profile && !profile.onboarding_complete) {
        navigate('/onboarding');
      }
    }
  }, [user, loading, profile, profileLoading, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-soft">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full gradient-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Header />
      <PageContainer className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-display font-semibold mb-1">Olá!</h2>
            <p className="text-muted-foreground">O que vamos vestir hoje?</p>
          </div>
          
          <TemporarySeasonBanner />
          
          <QuickActions />

          {/* Card promocional do Provador Virtual */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/provador')}
            className="cursor-pointer p-4 rounded-2xl border transition-all
              bg-gradient-to-r from-[hsl(238_45%_55%_/_0.08)] to-primary/8 
              border-[hsl(238_45%_55%_/_0.15)] hover:border-[hsl(238_45%_55%_/_0.25)]
              dark:from-[hsl(238_45%_55%_/_0.12)] dark:to-primary/12
              dark:border-[hsl(238_45%_55%_/_0.2)] dark:hover:border-[hsl(238_45%_55%_/_0.35)]
              dark:shadow-[0_0_20px_hsl(238_45%_55%_/_0.08)] dark:hover:shadow-[0_0_25px_hsl(238_45%_55%_/_0.15)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[hsl(238_45%_55%_/_0.15)] dark:bg-[hsl(238_45%_55%_/_0.25)]">
                  <Sparkles className="w-5 h-5 text-[hsl(240_50%_75%)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Espelho Neural</h3>
                  <p className="text-sm text-muted-foreground">Experimente roupas virtualmente</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.div>

          <LookOfTheDay />
          <MissionCard itemCount={itemCount} />
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}
