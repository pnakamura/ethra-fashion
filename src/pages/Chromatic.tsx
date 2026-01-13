import { useState, useEffect } from 'react';
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
import { useColorAnalysis, type ColorAnalysisResult } from '@/hooks/useColorAnalysis';
import { useAuth } from '@/hooks/useAuth';
import { useTemporarySeason } from '@/contexts/TemporarySeasonContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Palette, Sparkles, Compass } from 'lucide-react';
import { getSeasonById } from '@/data/chromatic-seasons';
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
                <div className="py-12 text-center text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Faça sua análise cromática para descobrir sua paleta ideal</p>
                </div>
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
