import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/PageContainer';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { AvatarManager } from '@/components/try-on/AvatarManager';
import { TryOnCanvas } from '@/components/try-on/TryOnCanvas';
import { TryOnOptions } from '@/components/try-on/TryOnOptions';
import { GarmentCapture } from '@/components/try-on/GarmentCapture';
import { WardrobeSelector } from '@/components/try-on/WardrobeSelector';
import { TryOnGallery } from '@/components/try-on/TryOnGallery';
import { useVirtualTryOn } from '@/hooks/useVirtualTryOn';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SelectedGarment {
  id?: string;
  imageUrl: string;
  processedImageUrl?: string;
  source: 'wardrobe' | 'external_photo' | 'screenshot' | 'url' | 'camera_scan';
  name?: string;
  category?: string | null;
}

interface TryOnResult {
  id: string;
  result_image_url: string | null;
  garment_image_url: string;
  status: string;
  processing_time_ms: number | null;
  created_at: string;
  model_used?: string | null;
  user_feedback?: string | null;
  retry_count?: number | null;
}

const MAX_OPTIONS = 3;
const MAX_RETRIES = 2;

// Model labels for user feedback
const MODEL_LABELS: Record<number, string> = {
  0: 'Flash (Rápido)',
  1: 'Pro (Balanceado)',
  2: 'Premium (Qualidade)',
};

export default function VirtualTryOn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedGarment, setSelectedGarment] = useState<SelectedGarment | null>(null);
  const [generatedResults, setGeneratedResults] = useState<TryOnResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  
  // Track retry count per garment (by imageUrl)
  const [retryCountMap, setRetryCountMap] = useState<Record<string, number>>({});

  const {
    primaryAvatar,
    isLoadingAvatar,
    isProcessing,
    retryCountdown,
    startTryOnAsync,
    deleteTryOnResult,
    submitFeedback,
  } = useVirtualTryOn();

  // Load preselected garment from session storage (from Recommendations)
  useEffect(() => {
    const preselect = sessionStorage.getItem('tryOn_preselect');
    if (preselect) {
      try {
        const data = JSON.parse(preselect);
        setSelectedGarment({
          id: data.id,
          imageUrl: data.imageUrl,
          source: data.source || 'wardrobe',
          category: data.category,
        });
        sessionStorage.removeItem('tryOn_preselect');
      } catch (e) {
        console.error('Failed to parse preselect:', e);
      }
    }
  }, []);

  // Reset generated results when garment changes
  useEffect(() => {
    setGeneratedResults([]);
    setSelectedResultIndex(0);
    // Reset retry count for new garment
    if (selectedGarment?.imageUrl) {
      setRetryCountMap(prev => ({
        ...prev,
        [selectedGarment.imageUrl]: 0,
      }));
    }
  }, [selectedGarment?.id, selectedGarment?.imageUrl]);

  const handleStartTryOn = async (retryCount = 0) => {
    if (!selectedGarment) return;

    try {
      const garmentSource = selectedGarment.source === 'wardrobe'
        ? 'wardrobe'
        : selectedGarment.source === 'camera_scan'
        ? 'external_photo'
        : 'screenshot';

      // Show which model we're using
      if (retryCount > 0) {
        toast.info(`Gerando com modelo ${MODEL_LABELS[retryCount]}...`);
      }

      const result = await startTryOnAsync({
        garmentImageUrl: selectedGarment.processedImageUrl || selectedGarment.imageUrl,
        garmentSource: garmentSource as 'wardrobe' | 'external_photo' | 'screenshot',
        garmentId: selectedGarment.id,
        category: selectedGarment.category || 'upper_body',
        retryCount,
      });

      const newResult = result as TryOnResult;
      setGeneratedResults((prev) => [...prev, newResult]);
      setSelectedResultIndex(generatedResults.length);
    } catch (error) {
      console.error('Try-on error:', error);
    }
  };

  const handleRetry = async () => {
    if (!selectedGarment) return;
    
    const garmentKey = selectedGarment.imageUrl;
    const currentRetry = retryCountMap[garmentKey] || 0;
    
    if (currentRetry >= MAX_RETRIES) {
      toast.info('Você já usou o modelo de maior qualidade. Tente com outra foto.');
      return;
    }
    
    const nextRetry = currentRetry + 1;
    
    // Update retry count
    setRetryCountMap(prev => ({
      ...prev,
      [garmentKey]: nextRetry,
    }));
    
    // Start new try-on with escalated model
    await handleStartTryOn(nextRetry);
  };

  const handleGenerateAnother = () => {
    if (generatedResults.length < MAX_OPTIONS && selectedGarment && !isProcessing) {
      // Use current retry count for this garment
      const currentRetry = retryCountMap[selectedGarment.imageUrl] || 0;
      handleStartTryOn(currentRetry);
    }
  };

  const handleDeleteOption = async (index: number) => {
    const resultToDelete = generatedResults[index];
    
    // Remove from local state first
    setGeneratedResults((prev) => prev.filter((_, i) => i !== index));
    
    // Adjust selected index
    if (selectedResultIndex >= index && selectedResultIndex > 0) {
      setSelectedResultIndex((prev) => prev - 1);
    }

    // Delete from database
    if (resultToDelete) {
      try {
        await supabase
          .from('try_on_results')
          .delete()
          .eq('id', resultToDelete.id);
      } catch (error) {
        console.error('Error deleting result:', error);
      }
    }
  };

  const handleFeedback = (feedback: 'like' | 'dislike') => {
    const result = generatedResults[selectedResultIndex];
    if (result?.id) {
      submitFeedback({ resultId: result.id, feedback });
      
      // Update local state to reflect feedback
      setGeneratedResults(prev => prev.map((r, i) => 
        i === selectedResultIndex ? { ...r, user_feedback: feedback } : r
      ));
    }
  };

  const handleSelectFromWardrobe = (item: {
    id: string;
    name: string;
    imageUrl: string;
    category: string | null;
  }) => {
    setSelectedGarment({
      id: item.id,
      imageUrl: item.imageUrl,
      source: 'wardrobe',
      name: item.name,
      category: item.category,
    });
  };

  const handleCapturedGarment = (garment: {
    imageUrl: string;
    processedImageUrl?: string;
    source: 'camera_scan' | 'screenshot' | 'url';
    id?: string;
  }) => {
    setSelectedGarment({
      id: garment.id,
      imageUrl: garment.imageUrl,
      processedImageUrl: garment.processedImageUrl,
      source: garment.source,
    });
  };

  const handleTryAgainWithGarment = (garmentImageUrl: string) => {
    setSelectedGarment({
      imageUrl: garmentImageUrl,
      source: 'wardrobe',
    });
    setGeneratedResults([]);
    setSelectedResultIndex(0);
  };

  const handleResetSelection = () => {
    setGeneratedResults([]);
    setSelectedResultIndex(0);
    setSelectedGarment(null);
  };

  // Get current result to display
  const currentResult = generatedResults[selectedResultIndex] || null;

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <Header />
        <PageContainer className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl mb-2">Provador Virtual</h2>
            <p className="text-muted-foreground mb-4">
              Entre para acessar o provador virtual
            </p>
            <Button onClick={() => navigate('/auth')} className="gradient-primary text-primary-foreground">
              Entrar
            </Button>
          </div>
        </PageContainer>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Header />

      <PageContainer className="flex-1 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* Hero */}
          <div className="text-center pt-4">
            <h1 className="font-display text-3xl text-gradient mb-2">
              Provador Virtual
            </h1>
            <p className="text-sm text-muted-foreground">
              Experimente roupas virtualmente com IA
            </p>
          </div>

          {/* Avatar Manager */}
          <AvatarManager />

          {/* No Avatar Warning */}
          {!isLoadingAvatar && !primaryAvatar && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure seu avatar para começar a provar roupas virtualmente.
              </AlertDescription>
            </Alert>
          )}

          {/* Try-On Canvas */}
          <TryOnCanvas
            result={currentResult}
            avatarImageUrl={primaryAvatar?.image_url}
            isProcessing={isProcessing}
            onRetry={handleRetry}
            onFeedback={handleFeedback}
            maxRetries={MAX_RETRIES}
          />

          {/* Multiple Options Selector */}
          {generatedResults.length > 0 && (
            <TryOnOptions
              results={generatedResults}
              selectedIndex={selectedResultIndex}
              onSelect={setSelectedResultIndex}
              onDelete={handleDeleteOption}
              isGenerating={isProcessing}
              canGenerateMore={generatedResults.length < MAX_OPTIONS && !!selectedGarment}
              onGenerateAnother={handleGenerateAnother}
            />
          )}

          {/* Garment Selection */}
          <Tabs defaultValue="closet" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="closet">Meu Closet</TabsTrigger>
              <TabsTrigger value="capture">Capturar</TabsTrigger>
            </TabsList>

            <TabsContent value="closet" className="mt-0">
              <WardrobeSelector
                onSelect={handleSelectFromWardrobe}
                selectedId={selectedGarment?.source === 'wardrobe' ? selectedGarment.id : undefined}
              />
            </TabsContent>

            <TabsContent value="capture" className="mt-0">
              <GarmentCapture onGarmentSelected={handleCapturedGarment} />
            </TabsContent>
          </Tabs>

          {/* Selected Garment Preview & Action */}
          <AnimatePresence>
            {selectedGarment && primaryAvatar && !isProcessing && generatedResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed bottom-20 left-4 right-4 z-40"
              >
                <div className="max-w-lg mx-auto bg-background/95 backdrop-blur-xl rounded-2xl shadow-elevated p-4 border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img
                        src={selectedGarment.processedImageUrl || selectedGarment.imageUrl}
                        alt="Selected garment"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {selectedGarment.name || 'Peça selecionada'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedGarment.source === 'wardrobe'
                          ? 'Do seu closet'
                          : selectedGarment.source === 'camera_scan'
                          ? 'Captura da câmera'
                          : 'De print/URL'}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleStartTryOn(0)}
                      disabled={!!retryCountdown}
                      className="gradient-primary text-primary-foreground flex-shrink-0 min-w-[90px]"
                    >
                      {retryCountdown ? (
                        <>Aguarde {retryCountdown}s</>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Provar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          <TryOnGallery
            onSelectResult={(result) => {
              setGeneratedResults([result]);
              setSelectedResultIndex(0);
            }}
            onTryAgainWithGarment={handleTryAgainWithGarment}
          />
        </motion.div>
      </PageContainer>

      <BottomNav />
    </div>
  );
}
