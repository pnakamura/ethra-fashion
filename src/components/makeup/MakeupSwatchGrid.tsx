import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { MakeupProduct } from '@/data/makeup-palettes';

interface MakeupSwatchGridProps {
  products: MakeupProduct[];
  isAvoid?: boolean;
  columns?: 4 | 5 | 6;
}

export function MakeupSwatchGrid({ products, isAvoid = false, columns = 5 }: MakeupSwatchGridProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  
  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    toast.success(`Cor ${hex} copiada!`);
    setTimeout(() => setCopiedColor(null), 2000);
  };
  
  const gridCols = {
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };
  
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Nenhuma cor disponível
      </p>
    );
  }
  
  return (
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {products.map((product) => (
        <MakeupSwatch
          key={product.hex}
          product={product}
          isAvoid={isAvoid}
          isCopied={copiedColor === product.hex}
          onCopy={handleCopyColor}
        />
      ))}
    </div>
  );
}

interface MakeupSwatchProps {
  product: MakeupProduct;
  isAvoid: boolean;
  isCopied: boolean;
  onCopy: (hex: string) => void;
}

function MakeupSwatch({ product, isAvoid, isCopied, onCopy }: MakeupSwatchProps) {
  const finishLabels: Record<string, string> = {
    matte: 'Matte',
    satin: 'Cetim',
    gloss: 'Gloss',
    shimmer: 'Brilho',
    metallic: 'Metálico',
    cream: 'Cremoso',
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCopy(product.hex)}
            className="group relative flex flex-col items-center gap-1.5"
          >
            {/* Swatch circle */}
            <div
              className={`w-12 h-12 rounded-full shadow-soft transition-all border-2 border-background ${
                isAvoid ? 'opacity-60' : ''
              } ${isCopied ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              style={{ backgroundColor: product.hex }}
            >
              {/* Copied overlay */}
              {isCopied && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
              
              {/* Avoid icon */}
              {isAvoid && !isCopied && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-white/70" />
                </div>
              )}
            </div>
            
            {/* Product name */}
            <span className={`text-xs text-center leading-tight line-clamp-2 max-w-[60px] ${
              isAvoid ? 'text-muted-foreground' : 'text-foreground'
            }`}>
              {product.name}
            </span>
            
            {/* Finish badge (on hover) */}
            {product.finish && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2"
              >
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {finishLabels[product.finish] || product.finish}
                </Badge>
              </motion.div>
            )}
          </motion.button>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.hex}</p>
            {product.finish && (
              <p className="text-xs">
                <span className="text-muted-foreground">Acabamento:</span> {finishLabels[product.finish]}
              </p>
            )}
            {product.intensity && (
              <p className="text-xs">
                <span className="text-muted-foreground">Intensidade:</span> {product.intensity}
              </p>
            )}
            {product.description && (
              <p className="text-xs italic text-muted-foreground mt-1">{product.description}</p>
            )}
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <Copy className="w-3 h-3" /> Clique para copiar
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
