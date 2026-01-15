import { motion } from 'framer-motion';
import { ShoppingBag, Plus, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { PackingItem } from './PackingChecklist';

interface MissingItemsSuggestionProps {
  items: PackingItem[];
  onAddToWishlist?: (item: PackingItem) => void;
}

function ColorSwatches({ colors }: { colors: string[] }) {
  if (!colors || colors.length === 0) return null;
  
  return (
    <div className="flex gap-0.5">
      {colors.slice(0, 3).map((color, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full border border-white/20"
          style={{ backgroundColor: color.startsWith('#') ? color : `#${color}` }}
        />
      ))}
    </div>
  );
}

export function MissingItemsSuggestion({ items, onAddToWishlist }: MissingItemsSuggestionProps) {
  if (items.length === 0) return null;

  // Group by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <Card className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">
              Sugestões para Completar
            </h3>
            <p className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? 'peça sugerida' : 'peças sugeridas'} pela Aura ✨
            </p>
          </div>
        </div>
      </Card>

      {/* Suggestions Grid */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {category}
            </h4>
            
            <div className="grid gap-2">
              {categoryItems.map((item, idx) => (
                <motion.div
                  key={`${category}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-3 bg-muted/30 border-dashed border-muted-foreground/20 hover:border-amber-500/40 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Icon placeholder */}
                      <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-medium text-sm">{item.name}</h5>
                            {item.quantity > 1 && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5">
                                x{item.quantity}
                              </Badge>
                            )}
                          </div>
                          <ColorSwatches colors={item.colors} />
                        </div>

                        {/* Reason */}
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {item.reason}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {item.styles.slice(0, 2).map((style, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="text-[9px] px-1 py-0 h-4 border-amber-500/30 text-amber-600"
                            >
                              {style}
                            </Badge>
                          ))}
                          {item.fabrics.slice(0, 1).map((fabric, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="text-[9px] px-1 py-0 h-4 bg-muted/50"
                            >
                              {fabric}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action */}
                      {onAddToWishlist && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => onAddToWishlist(item)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span>
          Dica: Adicione essas peças ao seu closet depois de adquiri-las para ter looks completos!
        </span>
      </div>
    </motion.div>
  );
}
