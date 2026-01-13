import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { DemoSection } from '@/components/landing/DemoSection';
import { TestimonialsCarousel } from '@/components/landing/TestimonialsCarousel';
import { PersonasSection } from '@/components/landing/PersonasSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    async function checkAndRedirect() {
      if (!loading && user) {
        setCheckingProfile(true);
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('user_id', user.id)
            .single();
          
          if (profile && !profile.onboarding_complete) {
            navigate('/onboarding');
          } else {
            navigate('/');
          }
        } catch {
          navigate('/');
        }
      }
    }
    checkAndRedirect();
  }, [user, loading, navigate]);

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-soft">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full gradient-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background dark:bg-transparent">
      <HeroSection />
      <FeaturesGrid />
      <DemoSection />
      <TestimonialsCarousel />
      <PersonasSection />
      <CTASection />
      <Footer />
    </main>
  );
}
