import { useState, useEffect } from 'react';
import { Download, Loader2, Share2, MessageCircle, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateLookImage } from '@/lib/look-image-generator';

interface WardrobeItem {
  id: string;
  image_url: string;
  category?: string;
}

interface Outfit {
  id: string;
  name: string;
  items: string[] | null;
}

interface ShareLookModalProps {
  outfit: Outfit | null;
  items: WardrobeItem[];
  onClose: () => void;
}

export function ShareLookModal({ outfit, items, onClose }: ShareLookModalProps) {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (outfit && items.length > 0) {
      generateImage();
    }
    
    return () => {
      if (generatedImage) {
        URL.revokeObjectURL(generatedImage);
      }
    };
  }, [outfit, items]);

  const generateImage = async () => {
    if (!outfit || items.length === 0) return;
    
    setIsGenerating(true);
    try {
      const blob = await generateLookImage(items, outfit.name);
      setGeneratedBlob(blob);
      setGeneratedImage(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Erro ao gerar imagem',
        description: 'Tente novamente mais tarde',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedBlob || !outfit) return;
    
    const url = URL.createObjectURL(generatedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${outfit.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Imagem salva!' });
    markAsShared();
  };

  const handleNativeShare = async () => {
    if (!generatedBlob || !outfit) return;
    
    const file = new File([generatedBlob], `${outfit.name}.png`, { type: 'image/png' });
    
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: outfit.name,
          text: `Confira meu look "${outfit.name}" criado com Aura! ✨`,
          files: [file]
        });
        markAsShared();
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': generatedBlob })
        ]);
        toast({
          title: 'Imagem copiada!',
          description: 'Cole em qualquer app para compartilhar'
        });
        markAsShared();
      } catch {
        handleDownload();
      }
    }
  };

  const handleWhatsAppShare = () => {
    if (!outfit) return;
    
    const text = encodeURIComponent(
      `Olha o look que montei: "${outfit.name}" 👗✨\nCriado com Aura`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    markAsShared();
  };

  const markAsShared = async () => {
    if (!outfit) return;
    
    await supabase
      .from('outfits')
      .update({ shared_at: new Date().toISOString() })
      .eq('id', outfit.id);
  };

  const handleClose = () => {
    if (generatedImage) {
      URL.revokeObjectURL(generatedImage);
    }
    setGeneratedImage(null);
    setGeneratedBlob(null);
    onClose();
  };

  return (
    <Dialog open={!!outfit} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="font-display text-xl">Compartilhar Look</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="relative aspect-[4/5] bg-secondary mx-4 rounded-xl overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Gerando imagem...</span>
            </div>
          ) : generatedImage ? (
            <img
              src={generatedImage}
              alt={outfit?.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Preparando...</span>
            </div>
          )}
        </div>

        {/* Share buttons */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1"
              onClick={handleNativeShare}
              disabled={isGenerating || !generatedBlob}
            >
              <Share2 className="w-5 h-5" />
              <span className="text-xs">Compartilhar</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1"
              onClick={handleWhatsAppShare}
              disabled={isGenerating}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1"
              onClick={handleDownload}
              disabled={isGenerating || !generatedBlob}
            >
              <Download className="w-5 h-5" />
              <span className="text-xs">Salvar</span>
            </Button>
          </div>
          
          <p className="text-[11px] text-center text-muted-foreground">
            A imagem será gerada com marca d'água "Criado com Aura"
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
