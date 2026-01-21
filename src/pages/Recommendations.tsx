import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Palette, Shirt, Camera, ChevronRight, Sun, Briefcase, PartyPopper, Gem, Crown } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LookCard } from '@/components/recommendations/LookCard';
import { LookCardCompact } from '@/components/recommendations/LookCardCompact';
import { HarmonyStats } from '@/components/recommendations/HarmonyStats';
import { VIPLookCard } from '@/components/recommendations/VIPLookCard';
import { VIPLockedOverlay } from '@/components/recommendations/VIPLockedOverlay';
import { TemporarySeasonBanner } from '@/components/chromatic/TemporarySeasonBanner';
import { useLookRecommendations } from '@/hooks/useLookRecommendations';
import { useVIPLooks, VIPLook } from '@/hooks/useVIPLooks';
import { useTemporarySeason } from '@/contexts/TemporarySeasonContext';
import { usePermission } from '@/hooks/usePermission';
import { chromaticSeasons } from '@/data/chromatic-seasons';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useWardrobeItems } from '@/hooks/useWardrobeItems';

const occasions = [
  { value: 'all', label: 'Todos', icon: Sparkles },
  { value: 'casual', label: 'Casual', icon: Sun },
  { value: 'trabalho', label: 'Trabalho', icon: Briefcase },
  { value: 'festa', label: 'Festa', icon: PartyPopper },
  { value: 'formal', label: 'Formal', icon: Gem },
];

export default function Recommendations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const { temporarySeason, isUsingTemporary, getEffectiveSeason } = useTemporarySeason();
  const { looks, isLoading, generateLooks, loadCachedLooks } = useLookRecommendations();
  const { vipLooks, isLoading: isLoadingVIP, generateVIPLooks, loadCachedVIPLooks } = useVIPLooks();
  const { hasAccess: hasVIPAccess } = usePermission('vip_looks');

  // Use centralized hooks
  const { profile, colorSeason } = useProfile();
  const { items: wardrobeItems } = useWardrobeItems();

  // Load cached looks on mount
  useEffect(() => {
    loadCachedLooks();
    if (hasVIPAccess) {
      loadCachedVIPLooks();
    }
  }, [loadCachedLooks, loadCachedVIPLooks, hasVIPAccess]);

  // Get effective color analysis (considering temporary season)
  const userSeasonData = colorSeason 
    ? chromaticSeasons.find(s => s.id === colorSeason)
    : null;
  
  const effectiveSeason = getEffectiveSeason(userSeasonData);
  
  const colorAnalysis = isUsingTemporary && effectiveSeason
    ? {
        season: effectiveSeason.name,
        subtype: effectiveSeason.subtype,
        season_id: effectiveSeason.id,
        recommended_colors: effectiveSeason.colors.primary.map(c => c.name),
        avoid_colors: effectiveSeason.colors.avoid.map(c => c.name),
      }
    : ((profile as { color_analysis?: { season?: string; subtype?: string; recommended_colors?: string[]; avoid_colors?: string[] } | null })?.color_analysis as {
        season?: string;
        subtype?: string;
        recommended_colors?: string[];
        avoid_colors?: string[];
      } | null);
  
  const hasAnalysis = !!colorAnalysis || !!effectiveSeason;

  const handleGenerateLooks = () => {
    const occasion = selectedOccasion === 'all' ? undefined : selectedOccasion;
    generateLooks(occasion, 6);
  };

  const handleGenerateVIPLooks = () => {
    generateVIPLooks(3);
  };

  const handleOpenInCanvas = (look: { items: { id: string }[] }) => {
    sessionStorage.setItem('canvas_preload_items', JSON.stringify(look.items.map((i) => i.id)));
    navigate('/canvas');
  };

  const handleVIPOpenInCanvas = (look: VIPLook) => {
    sessionStorage.setItem('canvas_preload_items', JSON.stringify(look.items.map((i) => i.id)));
    navigate('/canvas');
  };

  const handleTryOnLook = (look: { items: { id: string; image_url?: string; imageUrl?: string; category?: string }[] }) => {
    const mainItem = look.items.find((i) =>
      ['top', 'camisa', 'blusa', 'vestido', 'upper_body', 'camiseta'].some((cat) =>
        i.category?.toLowerCase().includes(cat)
      )
    ) || look.items[0];

    if (mainItem) {
      const imageUrl = mainItem.image_url || mainItem.imageUrl;
      sessionStorage.setItem(
        'tryOn_preselect',
        JSON.stringify({
          id: mainItem.id,
          imageUrl,
          source: 'wardrobe',
          category: mainItem.category,
        })
      );
      navigate('/provador');
    }
  };

  const handleVIPTryOn = (look: VIPLook) => {
    handleTryOnLook(look);
  };

  // Get season colors for visual palette
  const getSeasonColors = () => {
    const season = colorAnalysis?.season?.toLowerCase() || '';
    if (season.includes('primavera')) return ['#FFE4B5', '#FFC0CB', '#98FB98', '#DDA0DD'];
    if (season.includes('verão') || season.includes('verao')) return ['#E6E6FA', '#B0C4DE', '#F0E68C', '#FFA07A'];
    if (season.includes('outono')) return ['#DAA520', '#8B4513', '#CD853F', '#BC8F8F'];
    if (season.includes('inverno')) return ['#191970', '#8B0000', '#4B0082', '#708090'];
    return ['#E5E5E5', '#D4D4D4', '#A3A3A3', '#737373'];
  };

  const seasonColors = getSeasonColors();

  if (!hasAnalysis) {
    return (
      <>
        <Header title="Looks" />
        <PageContainer className="px-4 py-6">
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="p-4 rounded-full bg-primary/10 inline-block mb-4">
              <Palette className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-semibold mb-2">
              Descubra sua paleta primeiro
            </h2>
            <p className="text-muted-foreground mb-6">
              Faça sua análise cromática para receber recomendações de looks personalizadas
              baseadas nas cores que mais valorizam você.
            </p>
            <Button
              onClick={() => navigate('/chromatic')}
              className="rounded-xl gradient-primary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Fazer Análise Cromática
            </Button>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header title="Looks" />
      <PageContainer className="px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Temporary Season Banner */}
          <TemporarySeasonBanner />

          {/* Hero with Season */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-primary/5 via-secondary/30 to-transparent p-5 rounded-2xl border border-border/50"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full shadow-lg flex-shrink-0"
                style={{
                  background: `conic-gradient(from 0deg, ${seasonColors.join(', ')})`,
                }}
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg font-medium">
                  {colorAnalysis?.season} {colorAnalysis?.subtype}
                </h2>
                <p className="text-sm text-muted-foreground">Sua paleta cromática</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/chromatic')}
                className="flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={handleGenerateLooks}
              disabled={isLoading}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors"
            >
              {isLoading ? (
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              ) : (
                <Sparkles className="w-6 h-6 text-primary" />
              )}
              <span className="text-xs font-medium">Gerar Look</span>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => navigate('/wardrobe')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
            >
              <Shirt className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-medium">Meu Closet</span>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate('/provador')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
            >
              <Camera className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-medium">Provar</span>
            </motion.button>
          </div>

          {/* Occasion Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {occasions.map((occ) => {
              const Icon = occ.icon;
              return (
                <Button
                  key={occ.value}
                  variant={selectedOccasion === occ.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedOccasion(occ.value)}
                  className="rounded-full whitespace-nowrap flex-shrink-0"
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {occ.label}
                </Button>
              );
            })}
          </div>

          <Tabs defaultValue="looks" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-11 rounded-xl bg-muted p-1">
              <TabsTrigger
                value="looks"
                className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Looks
              </TabsTrigger>
              <TabsTrigger
                value="vip"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-yellow-500/10 data-[state=active]:shadow-sm text-sm"
              >
                <Crown className="w-4 h-4 mr-2 text-amber-500" />
                VIP
              </TabsTrigger>
              <TabsTrigger
                value="harmony"
                className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm"
              >
                <Palette className="w-4 h-4 mr-2" />
                Harmonia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="looks" className="mt-5 space-y-5">
              {/* Looks Carousel */}
              {looks.length === 0 && !isLoading ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum look gerado ainda</p>
                  <Button
                    onClick={handleGenerateLooks}
                    variant="outline"
                    className="rounded-xl"
                  >
                    Gerar primeiro look
                  </Button>
                </div>
              ) : (
                <>
                  {/* Horizontal scroll carousel */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-sm">Looks sugeridos</h3>
                      <span className="text-xs text-muted-foreground">{looks.length} looks</span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x scrollbar-hide">
                      {isLoading && looks.length === 0
                        ? [...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="flex-shrink-0 w-44 h-56 rounded-xl bg-muted animate-pulse"
                            />
                          ))
                        : looks.map((look, index) => (
                            <LookCardCompact
                              key={`${look.name}-${index}`}
                              look={look}
                              index={index}
                              onOpenCanvas={() => handleOpenInCanvas(look)}
                              onTryOn={() => handleTryOnLook(look)}
                            />
                          ))}
                    </div>
                  </div>

                  {/* Full cards grid */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">Detalhes</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {looks.map((look, index) => (
                        <LookCard
                          key={`detail-${look.name}-${index}`}
                          look={look}
                          index={index}
                          onOpenInCanvas={handleOpenInCanvas}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Try-on integration card */}
              <Card className="p-4 bg-gradient-to-r from-primary/5 via-transparent to-transparent border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 flex-shrink-0">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">Prova virtual</h4>
                    <p className="text-xs text-muted-foreground">
                      Experimente as peças no provador IA
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gradient-primary flex-shrink-0"
                    onClick={() => navigate('/provador')}
                  >
                    Provar
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* VIP Tab Content */}
            <TabsContent value="vip" className="mt-5 space-y-5">
              {hasVIPAccess ? (
                <>
                  {/* VIP Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      <h3 className="font-display font-semibold">Looks Exclusivos</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateVIPLooks}
                      disabled={isLoadingVIP}
                      className="rounded-xl border-amber-500/30 hover:bg-amber-500/10"
                    >
                      {isLoadingVIP ? (
                        <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
                      )}
                      {isLoadingVIP ? 'Criando...' : 'Gerar VIP'}
                    </Button>
                  </div>

                  {/* VIP Looks Grid */}
                  {vipLooks.length === 0 && !isLoadingVIP ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-amber-500" />
                      </div>
                      <h4 className="font-medium mb-2">Nenhum look VIP gerado</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Gere looks exclusivos com tendências de passarela e harmonias avançadas
                      </p>
                      <Button
                        onClick={handleGenerateVIPLooks}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Looks VIP
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {isLoadingVIP && vipLooks.length === 0
                        ? [...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-2 border-amber-500/20 animate-pulse"
                            />
                          ))
                        : vipLooks.map((look, index) => (
                            <VIPLookCard
                              key={`vip-${look.name}-${index}`}
                              look={look}
                              index={index}
                              onOpenInCanvas={handleVIPOpenInCanvas}
                              onTryOn={handleVIPTryOn}
                            />
                          ))}
                    </div>
                  )}
                </>
              ) : (
                <VIPLockedOverlay previewCount={3} />
              )}
            </TabsContent>

            <TabsContent value="harmony" className="mt-5 space-y-5">
              <HarmonyStats
                items={wardrobeItems}
                colorSeason={
                  colorAnalysis?.season
                    ? `${colorAnalysis.season} ${colorAnalysis.subtype || ''}`
                    : null
                }
              />

              {/* Color palette preview */}
              {colorAnalysis?.recommended_colors && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Suas cores ideais</h3>
                  <div className="flex flex-wrap gap-2">
                    {colorAnalysis.recommended_colors.slice(0, 8).map((color, i) => (
                      <motion.div
                        key={color}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                      >
                        {color}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {colorAnalysis?.avoid_colors && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Cores a evitar</h3>
                  <div className="flex flex-wrap gap-2">
                    {colorAnalysis.avoid_colors.slice(0, 5).map((color, i) => (
                      <motion.div
                        key={color}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs"
                      >
                        {color}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => navigate('/chromatic')}
                variant="outline"
                className="w-full rounded-xl"
              >
                Refazer análise cromática
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}
