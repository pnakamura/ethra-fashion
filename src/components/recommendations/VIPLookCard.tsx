import { motion } from 'framer-motion';
import { Crown, Sparkles, Star, TrendingUp, Quote, Gem, Eye, ShoppingBag, Clock, MapPin, Wand2, Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { VIPLook } from '@/hooks/useVIPLooks';
import { cn } from '@/lib/utils';

interface VIPLookCardProps {
  look: VIPLook;
  index: number;
  onOpenInCanvas?: (look: VIPLook) => void;
  onTryOn?: (look: VIPLook) => void;
}

const tierConfig = {
  gold: {
    icon: Crown,
    label: 'Gold',
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    glow: 'shadow-[0_0_20px_hsl(45_100%_50%_/_0.4)]',
    bg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10',
    border: 'border-amber-500/50',
    text: 'text-amber-500',
  },
  silver: {
    icon: Star,
    label: 'Silver',
    gradient: 'from-slate-300 via-gray-400 to-slate-500',
    glow: 'shadow-[0_0_15px_hsl(220_10%_60%_/_0.3)]',
    bg: 'bg-gradient-to-br from-slate-400/20 to-gray-500/10',
    border: 'border-slate-400/50',
    text: 'text-slate-400',
  },
  bronze: {
    icon: Gem,
    label: 'Bronze',
    gradient: 'from-orange-400 via-amber-600 to-orange-700',
    glow: 'shadow-[0_0_12px_hsl(30_80%_50%_/_0.25)]',
    bg: 'bg-gradient-to-br from-orange-500/20 to-amber-600/10',
    border: 'border-orange-500/40',
    text: 'text-orange-500',
  },
};

export function VIPLookCard({ look, index, onOpenInCanvas, onTryOn }: VIPLookCardProps) {
  const tier = tierConfig[look.vip_tier] || tierConfig.bronze;
  const TierIcon = tier.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={cn(
          'relative border-2 transition-all duration-300 hover:scale-[1.01]',
          tier.border,
          tier.glow
        )}
      >
        {/* VIP Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge
            className={cn(
              'bg-gradient-to-r text-white font-semibold px-3 py-1',
              tier.gradient
            )}
          >
            <TierIcon className="w-3.5 h-3.5 mr-1.5" />
            VIP {tier.label}
          </Badge>
        </div>

        {/* Score Badge */}
        <div className="absolute top-3 right-3 z-10">
          <div className={cn('px-2.5 py-1 rounded-full text-xs font-bold', tier.bg, tier.text)}>
            {look.chromatic_score}%
          </div>
        </div>

        {/* Items Preview */}
        <div className="relative h-48 flex items-center justify-center p-4 bg-gradient-to-b from-transparent to-background/50 overflow-hidden rounded-t-lg">
          <div className="flex -space-x-6">
            {look.items.slice(0, 4).map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: index * 0.1 + i * 0.1 }}
                className="relative"
                style={{ zIndex: look.items.length - i }}
              >
                <OptimizedImage
                  src={item.image_url}
                  alt={item.name || item.category}
                  className={cn(
                    'w-20 h-20 rounded-xl object-cover border-2 shadow-lg',
                    item.chromatic_compatibility === 'ideal' ? 'border-emerald-400' : 'border-border'
                  )}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title & Trend */}
          <div className="space-y-1">
            <h3 className="font-display font-semibold text-lg leading-tight">{look.name}</h3>
            {look.trend_inspiration && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>{look.trend_inspiration}</span>
              </div>
            )}
          </div>

          {/* Celebrity Inspiration - NEW VIP PREMIUM */}
          {look.celebrity_inspiration && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    Inspirado em <span className="text-pink-600 dark:text-pink-400">{look.celebrity_inspiration.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{look.celebrity_inspiration.reference}</p>
                  <p className="text-xs text-muted-foreground/80 italic">{look.celebrity_inspiration.why}</p>
                </div>
              </div>
            </div>
          )}

          {/* Color Theory Deep with Visual Palette - NEW VIP PREMIUM */}
          {look.color_theory_deep && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
              <div className="flex items-start gap-2.5">
                <Palette className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    {look.color_theory_deep.principle}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {look.color_theory_deep.explanation}
                  </p>
                  {look.color_theory_deep.hex_palette?.length > 0 && (
                    <div className="flex gap-1.5 pt-1">
                      {look.color_theory_deep.hex_palette.map((hex, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <div 
                              className="w-6 h-6 rounded-full shadow-md border border-white/20 cursor-pointer hover:scale-110 transition-transform"
                              style={{ backgroundColor: hex }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs font-mono">
                            {hex}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Investment Piece - NEW VIP PREMIUM */}
          {look.investment_piece && (
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-start gap-2.5">
                <ShoppingBag className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Peça de Investimento
                  </p>
                  <p className="text-sm">{look.investment_piece.description}</p>
                  <p className="text-xs text-muted-foreground italic">{look.investment_piece.why}</p>
                </div>
              </div>
            </div>
          )}

          {/* Occasion Details - NEW VIP PREMIUM */}
          {look.occasion_details && (
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                <MapPin className="w-3 h-3" />
                <span>{look.occasion_details.perfect_for}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{look.occasion_details.best_time}</span>
              </div>
            </div>
          )}

          {/* Confidence Boost */}
          {look.confidence_boost && (
            <div className={cn('p-3 rounded-lg', tier.bg)}>
              <div className="flex items-start gap-2">
                <Quote className={cn('w-4 h-4 flex-shrink-0 mt-0.5', tier.text)} />
                <p className="text-sm italic font-medium">{look.confidence_boost}</p>
              </div>
            </div>
          )}

          {/* Styling Secrets - NEW VIP PREMIUM */}
          {look.styling_secrets && look.styling_secrets.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Segredos de Styling</span>
              </div>
              <ul className="space-y-1 pl-5">
                {look.styling_secrets.map((secret, i) => (
                  <li key={i} className="text-xs text-muted-foreground list-disc">
                    {secret}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Harmony (simplified) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium capitalize">{look.harmony_type?.replace('_', ' ')}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{look.color_harmony}</p>
          </div>

          {/* Accessories */}
          {look.accessory_suggestions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {look.accessory_suggestions.map((acc, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {acc}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-3">
            {onOpenInCanvas && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenInCanvas(look)}
                className="flex-1 rounded-xl min-w-0"
              >
                <Eye className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span className="truncate">Canvas</span>
              </Button>
            )}
            {onTryOn && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => onTryOn(look)}
                    className={cn(
                      'flex-1 rounded-xl bg-gradient-to-r text-white min-w-0',
                      tier.gradient
                    )}
                  >
                    <Crown className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    <span className="truncate">Provar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Experimentar no Provador Virtual</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
