import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, Link as LinkIcon, Upload, X, Check, Loader2, Sparkles, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useGarmentExtraction } from '@/hooks/useGarmentExtraction';
import { useSmartCamera } from '@/hooks/useSmartCamera';
import { toast } from 'sonner';
import { openCaptureInputWithFallback } from '@/lib/camera-fallback';
import { CameraFallbackModal } from '@/components/camera/CameraFallbackModal';
interface GarmentCaptureProps {
  onGarmentSelected: (garment: {
    imageUrl: string;
    processedImageUrl?: string;
    source: 'camera_scan' | 'screenshot' | 'url';
    id?: string;
  }) => void;
}

export function GarmentCapture({ onGarmentSelected }: GarmentCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [activeTab, setActiveTab] = useState('camera');
  const [imageQuality, setImageQuality] = useState<number | null>(null);
  const [showCameraFallback, setShowCameraFallback] = useState(false);
  
  const { extractGarmentAsync, extractFromUrlAsync, isExtracting, externalGarments } = useGarmentExtraction();
  const { analyzeImage } = useSmartCamera();

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sourceType: 'camera_scan' | 'screenshot'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file, sourceType);
  };

  const processFile = async (file: File, sourceType: 'camera_scan' | 'screenshot') => {
    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Analyze image quality
    try {
      const analysis = await analyzeImage(url);
      if (analysis) {
        setImageQuality(analysis.overallScore);
        if (analysis.overallScore < 50) {
          toast.warning('Qualidade da imagem baixa', {
            description: analysis.tips[0] || 'Tente capturar novamente com melhor iluminação'
          });
        }
      }
    } catch (err) {
      console.warn('Could not analyze image quality:', err);
    }

    try {
      const garment = await extractGarmentAsync({
        file,
        sourceType,
      });

      onGarmentSelected({
        imageUrl: garment.original_image_url,
        processedImageUrl: garment.processed_image_url || undefined,
        source: sourceType,
        id: garment.id,
      });
    } catch (error) {
      console.error('Error extracting garment:', error);
      setPreviewUrl(null);
      setImageQuality(null);
    }
  };

  const handleCameraClick = () => {
    openCaptureInputWithFallback({
      facingMode: 'environment',
      onFile: (file) => processFile(file, 'camera_scan'),
      onFallbackNeeded: () => {
        setShowCameraFallback(true);
      },
      timeoutMs: 1500,
    });
  };

  const handleFallbackCapture = (file: File) => {
    processFile(file, 'camera_scan');
    setShowCameraFallback(false);
  };

  const handleUrlSubmit = async () => {
    if (!sourceUrl) return;

    // Validate URL format
    if (!isValidUrl(sourceUrl)) {
      toast.error('Por favor, insira uma URL válida (começando com http:// ou https://)');
      return;
    }

    // Show loading state with URL as temporary preview
    setPreviewUrl(sourceUrl);

    try {
      // Use server-side fetch via Edge Function (bypasses CORS)
      const garment = await extractFromUrlAsync({ url: sourceUrl });

      onGarmentSelected({
        imageUrl: garment.original_image_url,
        processedImageUrl: garment.processed_image_url || undefined,
        source: 'url',
        id: garment.id,
      });
    } catch (error) {
      console.error('Error extracting garment from URL:', error);
      setPreviewUrl(null);
    }
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    setSourceUrl('');
    setImageQuality(null);
  };

  return (
    <>
      <Card className="p-4 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-medium">Capturar Peça Externa</h3>
          {imageQuality !== null && (
            <Badge 
              variant={imageQuality >= 65 ? 'default' : imageQuality >= 50 ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {imageQuality}%
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="camera" className="text-xs">
              <Camera className="w-3 h-3 mr-1" />
              Câmera
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs">
              <Image className="w-3 h-3 mr-1" />
              Galeria
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs">
              <LinkIcon className="w-3 h-3 mr-1" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-0">
            <div className="space-y-3">
              <div className="p-4 bg-secondary/50 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Aponte para uma roupa no cabide ou manequim
                </p>
                <Button
                  onClick={handleCameraClick}
                  disabled={isExtracting}
                  className="gradient-primary text-primary-foreground"
                >
                  {isExtracting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  Abrir Câmera
                </Button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileSelect(e, 'camera_scan')}
                className="hidden"
              />
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-0">
            <div className="space-y-3">
              <div className="p-4 bg-secondary/50 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Envie um print ou foto da peça
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                  variant="outline"
                >
                  {isExtracting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Escolher Imagem
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'screenshot')}
                className="hidden"
              />
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-0">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Cole a URL do produto ou da imagem direta
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://loja.com/produto ou URL da imagem"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleUrlSubmit}
                  disabled={!sourceUrl || isExtracting}
                  size="icon"
                >
                  {isExtracting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Funciona com páginas de produto (Amazon, Shein, Zara...) ou URLs de imagem
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 relative"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-secondary">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {isExtracting && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        {activeTab === 'url' ? 'Analisando e extraindo peça...' : 'Extraindo peça...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearPreview}
                className="absolute top-2 right-2 bg-background/80"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Captures */}
        {externalGarments && externalGarments.length > 0 && !previewUrl && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Capturas recentes</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {externalGarments.slice(0, 6).map((garment) => (
                <button
                  key={garment.id}
                  onClick={() =>
                    onGarmentSelected({
                      imageUrl: garment.original_image_url,
                      processedImageUrl: garment.processed_image_url || undefined,
                      source: garment.source_type as 'camera_scan' | 'screenshot' | 'url',
                      id: garment.id,
                    })
                  }
                  className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-transparent hover:ring-primary/50 transition-all bg-secondary"
                >
                  <OptimizedImage
                    src={garment.processed_image_url || garment.original_image_url}
                    alt="Peça capturada"
                    aspectRatio="square"
                    className="w-full h-full object-cover"
                    fallbackIcon={<ImageOff className="w-4 h-4 text-muted-foreground/50" />}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Camera Fallback Modal */}
      <CameraFallbackModal
        isOpen={showCameraFallback}
        onClose={() => setShowCameraFallback(false)}
        onCapture={handleFallbackCapture}
        mode="garment"
      />
    </>
  );
}
