import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, X, Palette, Droplets, Eye, Brush, Heart, Gem, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MakeupSwatchGrid } from './MakeupSwatchGrid';
import { useMakeupRecommendations } from '@/hooks/useMakeupRecommendations';
import type { MakeupProduct } from '@/data/makeup-palettes';

interface MakeupRecommendationsProps {
  seasonId?: string;
  compact?: boolean;
}

type MakeupCategoryKey = 'lips' | 'eyes' | 'face' | 'nails';
type FinishFilter = 'all' | 'matte' | 'satin' | 'gloss' | 'shimmer' | 'metallic' | 'cream';

export function MakeupRecommendations({ seasonId, compact = false }: MakeupRecommendationsProps) {
  const [activeCategory, setActiveCategory] = useState<MakeupCategoryKey>('lips');
  const [activeFinish, setActiveFinish] = useState<FinishFilter>('all');
  const [showAvoid, setShowAvoid] = useState(false);
  
  const {
    seasonName,
    seasonSubtype,
    isUsingTemporary,
    lips,
    eyeshadow,
    eyeliner,
    blush,
    contour,
    highlighter,
    nails,
    avoidLips,
    avoidEyeshadow,
    avoidBlush,
    hasMakeupData,
    isLoading,
  } = useMakeupRecommendations();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!hasMakeupData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-6 rounded-xl bg-secondary/50"
      >
        <Palette className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">
          Faça sua análise cromática para ver recomendações de maquiagem personalizadas.
        </p>
      </motion.div>
    );
  }
  
  // Filter products by finish
  const filterByFinish = (products: MakeupProduct[]) => {
    if (activeFinish === 'all') return products;
    return products.filter(p => p.finish === activeFinish);
  };
  
  // Get products for current category
  const getCategoryProducts = () => {
    switch (activeCategory) {
      case 'lips':
        return showAvoid ? avoidLips : filterByFinish(lips);
      case 'eyes':
        return showAvoid ? avoidEyeshadow : filterByFinish([...eyeshadow, ...eyeliner]);
      case 'face':
        return showAvoid ? avoidBlush : filterByFinish([...blush, ...contour, ...highlighter]);
      case 'nails':
        return filterByFinish(nails);
      default:
        return [];
    }
  };
  
  const categories: { key: MakeupCategoryKey; label: string; icon: React.ReactNode }[] = [
    { key: 'lips', label: 'Lábios', icon: <Heart className="w-4 h-4" /> },
    { key: 'eyes', label: 'Olhos', icon: <Eye className="w-4 h-4" /> },
    { key: 'face', label: 'Face', icon: <Brush className="w-4 h-4" /> },
    { key: 'nails', label: 'Unhas', icon: <Gem className="w-4 h-4" /> },
  ];
  
  const finishes: { key: FinishFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'matte', label: 'Matte' },
    { key: 'satin', label: 'Cetim' },
    { key: 'shimmer', label: 'Brilho' },
    { key: 'metallic', label: 'Metálico' },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-medium">
              Maquiagem para {seasonName} {seasonSubtype}
            </h3>
          </div>
          {isUsingTemporary && (
            <Badge variant="outline" className="text-amber-600 border-amber-500/50">
              Experimental
            </Badge>
          )}
        </div>
      )}
      
      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as MakeupCategoryKey)}>
        <TabsList className="grid w-full grid-cols-4 h-10 rounded-xl bg-muted p-1">
          {categories.map((cat) => (
            <TabsTrigger 
              key={cat.key}
              value={cat.key} 
              className="rounded-lg text-xs flex items-center gap-1.5"
            >
              {cat.icon}
              <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Filters */}
        <div className="flex items-center justify-between mt-4">
          {/* Finish filter */}
          <ScrollArea className="w-full max-w-[280px]">
            <div className="flex items-center gap-2 pb-2">
              <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              {finishes.map((finish) => (
                <Button
                  key={finish.key}
                  variant={activeFinish === finish.key ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs px-2.5 whitespace-nowrap"
                  onClick={() => setActiveFinish(finish.key)}
                >
                  {finish.label}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          
          {/* Show avoid toggle */}
          {activeCategory !== 'nails' && (
            <Button
              variant={showAvoid ? 'destructive' : 'outline'}
              size="sm"
              className="h-7 text-xs flex-shrink-0"
              onClick={() => setShowAvoid(!showAvoid)}
            >
              {showAvoid ? (
                <>
                  <X className="w-3 h-3 mr-1" />
                  Evitar
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Ideais
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Content */}
        {categories.map((cat) => (
          <TabsContent key={cat.key} value={cat.key} className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Section header */}
              <div className="flex items-center gap-2 mb-3">
                {showAvoid ? (
                  <X className="w-4 h-4 text-destructive" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-500" />
                )}
                <h4 className="text-sm font-medium">
                  {showAvoid ? 'Cores para evitar' : 'Cores recomendadas'}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {getCategoryProducts().length} cores
                </Badge>
              </div>
              
              {/* Swatch grid */}
              <MakeupSwatchGrid 
                products={getCategoryProducts()} 
                isAvoid={showAvoid}
                columns={compact ? 4 : 5}
              />
              
              {/* Category-specific tips */}
              {!compact && !showAvoid && (
                <CategoryTips category={activeCategory} />
              )}
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}

function CategoryTips({ category }: { category: MakeupCategoryKey }) {
  const tips: Record<MakeupCategoryKey, string[]> = {
    lips: [
      'Experimente aplicar gloss sobre batom matte para um efeito dimensional',
      'Para lábios finos, use tons mais claros e brilhantes',
      'Tons mais escuros criam efeito de lábios menores',
    ],
    eyes: [
      'Aplique tons claros no canto interno para iluminar o olhar',
      'Use cores escuras no côncavo para profundidade',
      'Delineadores coloridos são ótimos para destacar a cor dos olhos',
    ],
    face: [
      'Aplique blush nas maçãs do rosto e espalhe em direção às têmporas',
      'O contorno deve ser 2 tons mais escuro que sua pele',
      'Iluminador nos pontos altos: maçãs, nariz, arco do cupido',
    ],
    nails: [
      'Cores claras alongam as unhas visualmente',
      'Tons escuros ficam mais elegantes em unhas curtas',
      'Combine o esmalte com algum elemento do seu look',
    ],
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mt-4 p-3 rounded-xl bg-secondary/50"
    >
      <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
        <Droplets className="w-3 h-3" />
        Dicas de aplicação
      </h5>
      <ul className="space-y-1">
        {tips[category].map((tip, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="text-primary">•</span>
            {tip}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
