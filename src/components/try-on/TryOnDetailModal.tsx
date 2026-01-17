import { useState, useEffect } from 'react';
import { Download, Share2, Trash2, RotateCcw, Clock, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface TryOnResult {
  id: string;
  result_image_url: string | null;
  garment_image_url: string;
  status: string;
  processing_time_ms: number | null;
  created_at: string;
}

interface TryOnDetailModalProps {
  result: TryOnResult | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onTryAgain?: (garmentImageUrl: string) => void;
}

export function TryOnDetailModal({
  result,
  onClose,
  onDelete,
  onTryAgain,
}: TryOnDetailModalProps) {
  const [correctedImage, setCorrectedImage] = useState<string | null>(null);
  const [isCorrectingImage, setIsCorrectingImage] = useState(false);

  // Correct image orientation using Canvas API (real correction, not CSS transform)
  useEffect(() => {
    if (result?.result_image_url) {
      setIsCorrectingImage(true);
      setCorrectedImage(null);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // If image is landscape (wider than tall by 20%), rotate via Canvas
        if (img.width > img.height * 1.2) {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              canvas.width = img.height;
              canvas.height = img.width;
              
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate((90 * Math.PI) / 180);
              ctx.drawImage(img, -img.width / 2, -img.height / 2);
              
              setCorrectedImage(canvas.toDataURL('image/jpeg', 0.92));
            } else {
              setCorrectedImage(result.result_image_url);
            }
          } catch (err) {
            console.error('Canvas correction failed:', err);
            setCorrectedImage(result.result_image_url);
          }
        } else {
          setCorrectedImage(result.result_image_url);
        }
        setIsCorrectingImage(false);
      };
      
      img.onerror = () => {
        console.error('Failed to load image:', result.result_image_url?.substring(0, 100));
        // Signal error state instead of trying to use broken URL
        setCorrectedImage('error');
        setIsCorrectingImage(false);
      };
      
      img.src = result.result_image_url;
    } else {
      setCorrectedImage(null);
      setIsCorrectingImage(false);
    }
  }, [result?.result_image_url]);

  const handleDownload = async () => {
    const imageToDownload = correctedImage || result?.result_image_url;
    if (!imageToDownload) return;

    try {
      const response = await fetch(imageToDownload);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `try-on-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Imagem salva!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao baixar imagem');
    }
  };

  const handleShare = async () => {
    if (!result?.result_image_url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Look Virtual',
          text: 'Confira como esta peça ficou em mim!',
          url: result.result_image_url,
        });
      } catch {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(result.result_image_url);
      toast.success('Link copiado!');
    }
  };

  const handleDelete = () => {
    if (result?.id && onDelete) {
      onDelete(result.id);
    }
  };

  const handleTryAgain = () => {
    if (result?.garment_image_url && onTryAgain) {
      onTryAgain(result.garment_image_url);
    }
  };

  return (
    <Dialog open={!!result} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalhes da Prova Virtual</DialogTitle>
        </DialogHeader>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Main Image - Fluid container for correct proportions */}
        <div className="relative bg-secondary min-h-[300px] animate-in fade-in duration-300">
          {isCorrectingImage ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-muted-foreground animate-pulse">
                Otimizando imagem...
              </p>
            </div>
          ) : correctedImage === 'error' ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mb-3 text-destructive/50" />
              <p className="text-sm font-medium">Imagem indisponível</p>
              <p className="text-xs text-center px-4 mt-1">
                O arquivo pode ter expirado ou estar corrompido
              </p>
            </div>
          ) : correctedImage ? (
            <img
              src={correctedImage}
              alt="Resultado da prova virtual"
              className="w-full h-auto block max-h-[70vh]"
              style={{ objectFit: 'contain' }}
            />
          ) : result?.result_image_url ? (
            <img
              src={result.result_image_url}
              alt="Resultado da prova virtual"
              className="w-full h-auto block max-h-[70vh]"
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div className="flex items-center justify-center py-20">
              <Clock className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info and Actions */}
        <div className="p-4 space-y-4 border-t">
          {/* Metadata */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {result?.created_at &&
                formatDistanceToNow(new Date(result.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
            </span>
            {result?.processing_time_ms && (
              <span>Processado em {(result.processing_time_ms / 1000).toFixed(1)}s</span>
            )}
          </div>

          {/* Garment used */}
          {result?.garment_image_url && (
            <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
              <img
                src={result.garment_image_url}
                alt="Peça usada"
                className="w-12 h-14 rounded object-cover"
              />
              <span className="text-sm text-muted-foreground">
                Peça usada nesta prova
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleTryAgain}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Provar novamente
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
