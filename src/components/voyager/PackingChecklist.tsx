import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shirt, Footprints, Watch, Crown, Check, 
  ShoppingBag, Sparkles, ChevronRight, Info 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface PackingItem {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  colors: string[];
  styles: string[];
  fabrics: string[];
  in_wardrobe: boolean;
  image_url?: string;
  reason: string;
}

export interface PackingList {
  roupas: PackingItem[];
  calcados: PackingItem[];
  acessorios: PackingItem[];
  chapeus: PackingItem[];
}

interface PackingChecklistProps {
  packingList: PackingList;
  wardrobeItems: { id: string; image_url: string; category: string; name?: string }[];
  selectedItems: string[];
  onToggleItem: (id: string) => void;
}

const categoryConfig = {
  roupas: { icon: Shirt, label: 'Roupas', color: 'text-primary' },
  calcados: { icon: Footprints, label: 'Calçados', color: 'text-amber-500' },
  acessorios: { icon: Watch, label: 'Acessórios', color: 'text-emerald-500' },
  chapeus: { icon: Crown, label: 'Chapéus', color: 'text-violet-500' },
};

function ColorSwatches({ colors }: { colors: string[] }) {
  if (!colors || colors.length === 0) return null;
  
  return (
    <div className="flex gap-1">
      {colors.slice(0, 4).map((color, i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-full border border-border/50 shadow-sm"
          style={{ backgroundColor: color.startsWith('#') ? color : `#${color}` }}
        />
      ))}
      {colors.length > 4 && (
        <span className="text-[10px] text-muted-foreground">+{colors.length - 4}</span>
      )}
    </div>
  );
}

function PackingItemCard({ 
  item, 
  isSelected, 
  onToggle,
  wardrobeImage 
}: { 
  item: PackingItem; 
  isSelected: boolean; 
  onToggle: () => void;
  wardrobeImage?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-3 rounded-xl border transition-all",
        item.in_wardrobe 
          ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50" 
          : "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
      )}
    >
      <div className="flex gap-3">
        {/* Checkbox or Image */}
        <div className="flex-shrink-0">
          {item.in_wardrobe && wardrobeImage ? (
            <button
              onClick={onToggle}
              className={cn(
                "w-16 h-16 rounded-lg overflow-hidden relative transition-all",
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <img 
                src={wardrobeImage} 
                alt={item.name} 
                className="w-full h-full object-cover"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
              )}
            </button>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center border border-dashed border-muted-foreground/30">
              <ShoppingBag className="w-6 h-6 text-amber-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
              <p className="text-xs text-muted-foreground">{item.category}</p>
            </div>
            
            <div className="flex items-center gap-1.5">
              {item.quantity > 1 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  x{item.quantity}
                </Badge>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px]">
                    <p className="text-xs">{item.reason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Colors */}
          {item.colors.length > 0 && <ColorSwatches colors={item.colors} />}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {item.styles.slice(0, 2).map((style, i) => (
              <Badge key={i} variant="outline" className="text-[9px] px-1 py-0 h-4">
                {style}
              </Badge>
            ))}
            {item.fabrics.slice(0, 1).map((fabric, i) => (
              <Badge key={i} variant="outline" className="text-[9px] px-1 py-0 h-4 bg-muted/50">
                {fabric}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className="absolute top-2 right-2">
        {item.in_wardrobe ? (
          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] px-1.5 py-0">
            <Check className="w-2.5 h-2.5 mr-0.5" />
            No closet
          </Badge>
        ) : (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px] px-1.5 py-0">
            <ShoppingBag className="w-2.5 h-2.5 mr-0.5" />
            Sugestão
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

export function PackingChecklist({ 
  packingList, 
  wardrobeItems, 
  selectedItems, 
  onToggleItem 
}: PackingChecklistProps) {
  const [activeTab, setActiveTab] = useState<keyof PackingList>('roupas');

  // Create a map for quick wardrobe lookup
  const wardrobeMap = new Map(wardrobeItems.map(item => [item.id, item]));

  // Count items
  const getCounts = (items: PackingItem[]) => {
    const inWardrobe = items.filter(i => i.in_wardrobe).length;
    const suggestions = items.filter(i => !i.in_wardrobe).length;
    return { total: items.length, inWardrobe, suggestions };
  };

  const allItems = [
    ...packingList.roupas,
    ...packingList.calcados,
    ...packingList.acessorios,
    ...packingList.chapeus,
  ];
  
  const totalCounts = {
    total: allItems.length,
    inWardrobe: allItems.filter(i => i.in_wardrobe).length,
    suggestions: allItems.filter(i => !i.in_wardrobe).length,
  };

  return (
    <Card className="p-4 space-y-4 border-0 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">Checklist Aura</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-600">
            <Check className="w-3 h-3" />
            {totalCounts.inWardrobe} no closet
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="flex items-center gap-1 text-amber-600">
            <ShoppingBag className="w-3 h-3" />
            {totalCounts.suggestions} sugestões
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as keyof PackingList)}>
        <TabsList className="w-full grid grid-cols-4 h-10">
          {(Object.keys(categoryConfig) as (keyof PackingList)[]).map((cat) => {
            const config = categoryConfig[cat];
            const counts = getCounts(packingList[cat]);
            const Icon = config.icon;
            
            return (
              <TabsTrigger 
                key={cat} 
                value={cat}
                className="flex items-center gap-1 text-xs data-[state=active]:bg-primary/10"
              >
                <Icon className={cn("w-3.5 h-3.5", config.color)} />
                <span className="hidden sm:inline">{config.label}</span>
                {counts.total > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-0.5">
                    {counts.total}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Content */}
        {(Object.keys(categoryConfig) as (keyof PackingList)[]).map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={cat}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-2"
              >
                {packingList[cat].length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    Nenhum item sugerido nesta categoria
                  </div>
                ) : (
                  packingList[cat].map((item, idx) => {
                    const wardrobeItem = item.id ? wardrobeMap.get(item.id) : undefined;
                    const isSelected = item.id ? selectedItems.includes(item.id) : false;
                    
                    return (
                      <PackingItemCard
                        key={item.id || `${cat}-${idx}`}
                        item={item}
                        isSelected={isSelected}
                        onToggle={() => item.id && onToggleItem(item.id)}
                        wardrobeImage={wardrobeItem?.image_url}
                      />
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
