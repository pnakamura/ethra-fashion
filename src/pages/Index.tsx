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
          <LookOfTheDay />
          <MissionCard itemCount={itemCount} />
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}
