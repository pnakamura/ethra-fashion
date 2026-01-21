import { motion } from 'framer-motion';
import { Crown, Sparkles, Star, TrendingUp, Quote, Gem, Eye } from 'lucide-react';
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
          'relative overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02]',
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
        <div className="relative h-48 flex items-center justify-center p-4 bg-gradient-to-b from-transparent to-background/50">
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

          {/* Confidence Boost */}
          {look.confidence_boost && (
            <div className={cn('p-3 rounded-lg', tier.bg)}>
              <div className="flex items-start gap-2">
                <Quote className={cn('w-4 h-4 flex-shrink-0 mt-0.5', tier.text)} />
                <p className="text-sm italic font-medium">{look.confidence_boost}</p>
              </div>
            </div>
          )}

          {/* Harmony */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium capitalize">{look.harmony_type.replace('_', ' ')}</span>
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
          <div className="flex gap-2 pt-2">
            {onOpenInCanvas && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenInCanvas(look)}
                className="flex-1 rounded-xl"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Canvas
              </Button>
            )}
            {onTryOn && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => onTryOn(look)}
                    className={cn(
                      'flex-1 rounded-xl bg-gradient-to-r text-white',
                      tier.gradient
                    )}
                  >
                    <Crown className="w-3.5 h-3.5 mr-1.5" />
                    Provar VIP
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
