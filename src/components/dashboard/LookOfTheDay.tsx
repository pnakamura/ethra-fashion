import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLookRecommendations } from '@/hooks/useLookRecommendations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function LookOfTheDay() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { looks, isLoading, generateLooks, loadCachedLooks } = useLookRecommendations();
  const [hasLoaded, setHasLoaded] = useState(false);

  // Check if user has enough items and chromatic analysis
  const { data: profile } = useQuery({
    queryKey: ['profile-chromatic', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('color_season, color_analysis')
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

  const hasChromaticAnalysis = !!profile?.color_analysis;
  const hasEnoughItems = itemCount >= 3;
  const canGenerateLooks = hasChromaticAnalysis && hasEnoughItems;

  // Auto-load looks if conditions are met
  useState(() => {
    if (canGenerateLooks && !hasLoaded && looks.length === 0) {
      setHasLoaded(true);
      loadCachedLooks().then(cached => {
        if (cached.length === 0) {
          generateLooks(undefined, 1);
        }
      });
    }
  });

  const todayLook = looks[0];

  const handleRefresh = () => {
    generateLooks(undefined, 1);
  };

  // Not ready state
  if (!canGenerateLooks) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className="overflow-hidden border border-border dark:border-primary/12">
          <div className="relative h-64 gradient-soft flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            <div className="text-center z-10 px-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium mb-4">
                <Sparkles className="w-3 h-3" />
                Look do Dia
              </div>
              <h3 className="text-2xl font-display font-semibold text-foreground mb-2">
                {!hasChromaticAnalysis ? 'Descubra sua paleta' : 'Adicione mais peças'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {!hasChromaticAnalysis 
                  ? 'Faça sua análise cromática para receber looks personalizados'
                  : `Você tem ${itemCount} peças. Adicione pelo menos 3 para receber sugestões.`}
              </p>
            </div>
          </div>
          <div className="p-4">
            <button 
              onClick={() => navigate(!hasChromaticAnalysis ? '/chromatic' : '/wardrobe')}
              className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-secondary dark:bg-secondary/50 hover:bg-accent dark:hover:bg-primary/10 transition-colors border border-transparent dark:border-primary/10"
            >
              <span className="text-sm font-medium text-secondary-foreground">
                {!hasChromaticAnalysis ? 'Fazer análise cromática' : 'Adicionar peças'}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Loading state
  if (isLoading && !todayLook) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className="overflow-hidden border border-border dark:border-primary/12">
          <div className="h-64 bg-muted dark:bg-muted/30 animate-pulse flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        </Card>
      </motion.div>
    );
  }

  // Has look state
  if (todayLook) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className="overflow-hidden border border-border dark:border-primary/12">
          {/* Look preview */}
          <div className="relative h-64 bg-muted dark:bg-muted/30">
            <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
              {todayLook.items.slice(0, 4).map((item) => (
                <div key={item.id} className="overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.name || item.category}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 dark:bg-primary/30 backdrop-blur-sm text-primary text-xs font-medium mb-2">
                <Sparkles className="w-3 h-3" />
                Look do Dia
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground">
                {todayLook.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {todayLook.color_harmony}
              </p>
            </div>
          </div>
          <div className="p-4 flex gap-2">
            <button 
              onClick={() => navigate('/recommendations')}
              className="flex-1 flex items-center justify-between py-3 px-4 rounded-xl bg-secondary dark:bg-secondary/50 hover:bg-accent dark:hover:bg-primary/10 transition-colors border border-transparent dark:border-primary/10"
            >
              <span className="text-sm font-medium text-secondary-foreground">
                Ver mais looks
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-xl dark:border-primary/20 dark:hover:bg-primary/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Fallback - generate looks
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
    >
      <Card className="overflow-hidden border border-border dark:border-primary/12">
        <div className="relative h-64 gradient-soft flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <div className="text-center z-10 px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium mb-4">
              <Sparkles className="w-3 h-3" />
              Look do Dia
            </div>
            <h3 className="text-2xl font-display font-semibold text-foreground mb-2">
              Pronto para sugestões!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Gere seu primeiro look personalizado
            </p>
            <Button 
              onClick={handleRefresh} 
              className="rounded-xl gradient-primary dark:shadow-[0_0_15px_hsl(45_100%_55%_/_0.2)]"
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Gerar Look
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
