import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGarmentColorAnalysis } from '@/hooks/useGarmentColorAnalysis';
import { checkCameraPermission, showPermissionDeniedToast, isCameraAvailable } from '@/lib/camera-permissions';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface DominantColor {
  hex: string;
  name: string;
  percentage: number;
}

interface WardrobeItem {
  id: string;
  name: string | null;
  category: string;
  color_code: string | null;
  season_tag: string | null;
  occasion: string | null;
  image_url: string;
  dominant_colors?: Json | null;
}

interface EditItemSheetProps {
  isOpen: boolean;
  item: WardrobeItem | null;
  onClose: () => void;
  onSave: (id: string, updates: {
    name: string;
    category: string;
    color_code: string;
    season_tag: string;
    occasion: string;
    image_url: string;
    dominant_colors?: DominantColor[];
  }) => void;
}

// Categories grouped by type
const categoryGroups = {
  'Roupas': ['Top', 'Bottom', 'Vestido', 'Casaco', 'Macacão', 'Saia', 'Camisa', 'Blazer'],
  'Calçados': ['Sapato', 'Tênis', 'Sandália', 'Bota', 'Chinelo', 'Salto'],
  'Acessórios': ['Bolsa', 'Cinto', 'Chapéu', 'Óculos', 'Lenço/Echarpe', 'Mochila', 'Carteira'],
  'Joias': ['Colar', 'Brinco', 'Pulseira', 'Anel', 'Relógio', 'Tornozeleira', 'Broche'],
};
const seasons = ['Primavera', 'Verão', 'Outono', 'Inverno', 'Todas'];
const occasions = ['Casual', 'Trabalho', 'Festa', 'Esporte', 'Formal'];

export function EditItemSheet({ isOpen, item, onClose, onSave }: EditItemSheetProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [colorCode, setColorCode] = useState('#e5d5c5');
  const [seasonTag, setSeasonTag] = useState('');
  const [occasion, setOccasion] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [analyzedColors, setAnalyzedColors] = useState<DominantColor[] | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAnalyzing, analyzeGarment } = useGarmentColorAnalysis();

  // Populate form when item changes
  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.category || '');
      setColorCode(item.color_code || '#e5d5c5');
      setSeasonTag(item.season_tag || '');
      setOccasion(item.occasion || '');
      setImageUrl(item.image_url || '');
      // Parse dominant_colors from Json to DominantColor[]
      if (Array.isArray(item.dominant_colors)) {
        setAnalyzedColors(item.dominant_colors as unknown as DominantColor[]);
      } else {
        setAnalyzedColors(null);
      }
    }
  }, [item]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImageUrl(base64);

      // Analyze colors automatically
      const result = await analyzeGarment(base64);
      if (result) {
        setAnalyzedColors(result.dominant_colors);
        // Set color_code to most dominant color
        if (result.dominant_colors[0]) {
          setColorCode(result.dominant_colors[0].hex);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraClick = async () => {
    // Check camera availability first
    const hasCamera = await isCameraAvailable();
    if (!hasCamera) {
      toast.error('Câmera não encontrada', {
        description: 'Nenhuma câmera foi detectada no seu dispositivo.',
        duration: 5000,
      });
      return;
    }

    // Check permission status
    const permissionStatus = await checkCameraPermission();
    if (permissionStatus === 'denied') {
      showPermissionDeniedToast();
      return;
    }

    // Create a new input element for camera to avoid state issues
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.[0]) {
        const syntheticEvent = {
          target: { files: target.files }
        } as React.ChangeEvent<HTMLInputElement>;
        handleImageSelect(syntheticEvent);
      }
    };
    input.click();
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleSubmit = () => {
    if (!category || !item) return;
    
    onSave(item.id, {
      name,
      category,
      color_code: colorCode,
      season_tag: seasonTag,
      occasion,
      image_url: imageUrl,
      dominant_colors: analyzedColors || undefined,
    });
    
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && item && (
        <>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-elevated max-h-[85vh] overflow-auto"
          >
            <div className="p-6">
              {/* Handle */}
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-semibold">Editar Peça</h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Image upload area */}
              <div className="mb-6">
                <div 
                  onClick={handleGalleryClick}
                  className="aspect-square max-w-[200px] mx-auto rounded-2xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden"
                >
                  {imageUrl ? (
                    <>
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="text-sm mt-2 font-medium">Analisando cores...</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-full bg-secondary">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Adicionar foto</p>
                        <p className="text-xs text-muted-foreground">ou arraste aqui</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Analyzed colors preview */}
                {analyzedColors && analyzedColors.length > 0 && (
                  <div className="flex flex-col items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">Cores detectadas:</span>
                    <div className="flex gap-1.5 justify-center">
                      {analyzedColors.map((color, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full border-2 border-background shadow-md"
                          style={{ backgroundColor: color.hex }}
                          title={`${color.name} (${color.percentage}%)`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-4 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl"
                    onClick={handleCameraClick}
                    disabled={isAnalyzing}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Câmera
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl"
                    onClick={handleGalleryClick}
                    disabled={isAnalyzing}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Galeria
                  </Button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm text-muted-foreground">
                    Nome (opcional)
                  </Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Blusa de seda branca"
                    className="mt-1.5 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Categoria *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1.5 rounded-xl">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryGroups).map(([groupName, items]) => (
                        <SelectGroup key={groupName}>
                          <SelectLabel className="text-xs text-muted-foreground px-2 pt-2 font-semibold">
                            {groupName}
                          </SelectLabel>
                          {items.map((cat) => (
                            <SelectItem key={cat} value={cat.toLowerCase()}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Cor</Label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="color"
                        value={colorCode}
                        onChange={(e) => setColorCode(e.target.value)}
                        className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                      />
                      <Input
                        value={colorCode}
                        onChange={(e) => setColorCode(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Estação</Label>
                    <Select value={seasonTag} onValueChange={setSeasonTag}>
                      <SelectTrigger className="mt-1.5 rounded-xl">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons.map((season) => (
                          <SelectItem key={season} value={season.toLowerCase()}>
                            {season}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Ocasião</Label>
                  <Select value={occasion} onValueChange={setOccasion}>
                    <SelectTrigger className="mt-1.5 rounded-xl">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {occasions.map((occ) => (
                        <SelectItem key={occ} value={occ.toLowerCase()}>
                          {occ}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!category || isAnalyzing}
                  className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-medium mt-6"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
