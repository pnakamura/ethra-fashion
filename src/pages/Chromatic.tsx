import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { ColorAnalysis } from '@/components/chromatic/ColorAnalysis';
import { ColorAnalysisResult as ColorResultDisplay } from '@/components/chromatic/ColorAnalysisResult';
import { ChromaticHero } from '@/components/chromatic/ChromaticHero';
import { SeasonExplorer } from '@/components/chromatic/SeasonExplorer';
import { SeasonDetailModal } from '@/components/chromatic/SeasonDetailModal';
import { TemporarySeasonBanner } from '@/components/chromatic/TemporarySeasonBanner';
import { TemporaryPalettePreview } from '@/components/chromatic/TemporaryPalettePreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useColorAnalysis, type ColorAnalysisResult } from '@/hooks/useColorAnalysis';
import { useAuth } from '@/hooks/useAuth';
import { useTemporarySeason } from '@/contexts/TemporarySeasonContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Palette, Sparkles, Compass, Camera, ArrowRight } from 'lucide-react';
import { getSeasonById, chromaticSeasons } from '@/data/chromatic-seasons';
import { calculateWardrobeStats } from '@/lib/chromatic-match';
export default function Chromatic() {
  const { user } = useAuth();
  const { loadFromProfile, saveToProfile, result, reset } = useColorAnalysis();
  const { temporarySeason, isUsingTemporary, getEffectiveSeason } = useTemporarySeason();
  const [loading, setLoading] = useState(true);
  const [savedAnalysis, setSavedAnalysis] = useState<ColorAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('palette');
  const [showSeasonDetail, setShowSeasonDetail] = useState(false);

  // Load wardrobe items for stats
  const { data: wardrobeItems = [] } = useQuery({
    queryKey: ['wardrobe-chromatic-stats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('wardrobe_items')
        .select('id, chromatic_compatibility')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const wardrobeStats = calculateWardrobeStats(wardrobeItems);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const analysis = await loadFromProfile();
        if (analysis) {
          setSavedAnalysis(analysis);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [user]);

  // Auto-switch to palette tab when experimenting
  useEffect(() => {
    if (isUsingTemporary && temporarySeason) {
      setActiveTab('palette');
    }
  }, [isUsingTemporary, temporarySeason]);

  const handleSaveAnalysis = async (analysis: ColorAnalysisResult) => {
    const success = await saveToProfile(analysis);
    if (success) {
      setSavedAnalysis(analysis);
      setActiveTab('palette');
    }
  };

  const handleNewAnalysis = () => {
    reset();
    setActiveTab('analyze');
  };

  const currentSeason = savedAnalysis ? getSeasonById(savedAnalysis.season_id) : null;

  if (loading) {
    return (
      <>
        <Header title="Cromática" />
        <PageContainer className="px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header title="Cromática" />
      <PageContainer className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Temporary Season Banner */}
          <TemporarySeasonBanner />

          {/* Hero section */}
          <ChromaticHero
            analysis={savedAnalysis}
            temporarySeason={temporarySeason}
            isUsingTemporary={isUsingTemporary}
            wardrobeStats={wardrobeStats}
            onExploreClick={() => setShowSeasonDetail(true)}
            onNewAnalysis={handleNewAnalysis}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted p-1">
              <TabsTrigger value="palette" className="rounded-lg text-xs sm:text-sm">
                <Palette className="w-3.5 h-3.5 mr-1.5" />
                Minha Paleta
              </TabsTrigger>
              <TabsTrigger value="analyze" className="rounded-lg text-xs sm:text-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Analisar
              </TabsTrigger>
              <TabsTrigger value="explore" className="rounded-lg text-xs sm:text-sm">
                <Compass className="w-3.5 h-3.5 mr-1.5" />
                Explorar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="palette" className="mt-4">
              {isUsingTemporary && temporarySeason ? (
                <TemporaryPalettePreview 
                  temporarySeason={temporarySeason}
                  savedAnalysis={savedAnalysis}
                />
              ) : savedAnalysis ? (
                <ColorResultDisplay
                  result={savedAnalysis}
                  onRetry={handleNewAnalysis}
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Empty State Header */}
                  <div className="text-center py-6">
                    <motion.div 
                      className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Palette className="w-10 h-10 text-primary" />
                    </motion.div>
                    <h3 className="font-display text-xl font-semibold mb-2">
                      Descubra sua paleta ideal
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      A análise cromática revela as cores que harmonizam com seu tom de pele, olhos e cabelo
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => setActiveTab('analyze')}
                      className="h-auto py-4 flex-col gap-2 gradient-primary text-primary-foreground"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-sm font-medium">Fazer Análise</span>
                      <span className="text-xs opacity-80">Com IA e selfie</span>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('explore')}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <Compass className="w-5 h-5" />
                      <span className="text-sm font-medium">Explorar Paletas</span>
                      <span className="text-xs text-muted-foreground">12 estações</span>
                    </Button>
                  </div>

                  {/* Preview of Seasons */}
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center">
                      Prévia das estações cromáticas
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {chromaticSeasons.slice(0, 4).map((season, i) => (
                        <motion.div
                          key={season.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.1 }}
                          className="text-center"
                        >
                          <div className="flex -space-x-1 justify-center mb-2">
                            {season.colors.primary.slice(0, 3).map((color) => (
                              <div
                                key={color.hex}
                                className="w-5 h-5 rounded-full border-2 border-card shadow-sm"
                                style={{ backgroundColor: color.hex }}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {season.name}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveTab('explore')}
                      className="w-full text-primary"
                    >
                      Ver todas as 12 estações
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="analyze" className="mt-4">
              <ColorAnalysis
                onComplete={() => {}}
                onSave={handleSaveAnalysis}
                showSaveButton={!!user}
              />
              
              {!user && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Faça login para salvar sua paleta
                </p>
              )}
            </TabsContent>

            <TabsContent value="explore" className="mt-4">
              <SeasonExplorer 
                userSeasonId={savedAnalysis?.season_id}
                onTryPalette={() => setActiveTab('palette')}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
      <BottomNav />

      {/* Season detail modal */}
      <SeasonDetailModal
        season={currentSeason || null}
        isOpen={showSeasonDetail}
        onClose={() => setShowSeasonDetail(false)}
        isUserSeason={true}
      />
    </>
  );
}
