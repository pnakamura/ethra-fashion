import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { SeasonSelector } from '@/components/chromatic/SeasonSelector';
import { ColorPalette } from '@/components/chromatic/ColorPalette';
import { ColorAnalysis } from '@/components/chromatic/ColorAnalysis';
import { ColorAnalysisResult as ColorResultDisplay } from '@/components/chromatic/ColorAnalysisResult';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useColorAnalysis, type ColorAnalysisResult } from '@/hooks/useColorAnalysis';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Chromatic() {
  const { user } = useAuth();
  const { loadFromProfile, saveToProfile, result, reset } = useColorAnalysis();
  const [selectedSeason, setSelectedSeason] = useState<string | null>('summer-soft');
  const [loading, setLoading] = useState(true);
  const [savedAnalysis, setSavedAnalysis] = useState<ColorAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('palette');

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const analysis = await loadFromProfile();
        if (analysis) {
          setSavedAnalysis(analysis);
          setSelectedSeason(analysis.season_id);
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
      setSelectedSeason(analysis.season_id);
      setActiveTab('palette');
    }
  };

  const handleNewAnalysis = () => {
    reset();
    setActiveTab('analyze');
  };

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
          <div className="text-center">
            <h2 className="text-2xl font-display font-semibold mb-1">Sua Paleta de Cores</h2>
            <p className="text-sm text-muted-foreground">Descubra as cores que valorizam você</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted p-1">
              <TabsTrigger value="palette" className="rounded-lg">Minha Paleta</TabsTrigger>
              <TabsTrigger value="analyze" className="rounded-lg">Analisar</TabsTrigger>
              <TabsTrigger value="explore" className="rounded-lg">Explorar</TabsTrigger>
            </TabsList>

            <TabsContent value="palette" className="mt-4">
              {savedAnalysis ? (
                <div className="space-y-6">
                  {/* Show saved AI analysis result */}
                  <ColorResultDisplay
                    result={savedAnalysis}
                    onRetry={handleNewAnalysis}
                  />
                </div>
              ) : selectedSeason ? (
                <div className="space-y-4">
                  <ColorPalette seasonId={selectedSeason} />
                  
                  {/* CTA for AI analysis */}
                  <motion.div
                    className="bg-gradient-to-br from-primary/5 to-gold/5 rounded-2xl p-6 text-center border border-primary/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-display text-lg font-semibold mb-2">
                      Descubra sua paleta real
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Faça uma análise cromática com IA baseada na sua foto
                    </p>
                    <button
                      onClick={() => setActiveTab('analyze')}
                      className="text-primary font-medium hover:underline underline-offset-4"
                    >
                      Fazer análise gratuita →
                    </button>
                  </motion.div>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  Selecione sua estação na aba "Explorar" ou faça uma análise com IA
                </div>
              )}
            </TabsContent>

            <TabsContent value="analyze" className="mt-4">
              <ColorAnalysis
                onComplete={(result) => {
                  // Result is automatically shown by the component
                }}
                onSave={handleSaveAnalysis}
                showSaveButton={!!user}
              />
              
              {!user && (
                <motion.p
                  className="text-center text-sm text-muted-foreground mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Faça login para salvar sua paleta
                </motion.p>
              )}
            </TabsContent>

            <TabsContent value="explore" className="mt-4">
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Explore as 12 estações do sistema cromático
              </p>
              <SeasonSelector 
                selected={selectedSeason} 
                onSelect={(id) => {
                  setSelectedSeason(id);
                  setActiveTab('palette');
                }} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}