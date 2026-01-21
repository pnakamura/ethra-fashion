import { motion } from 'framer-motion';
import { Sparkles, ExternalLink, Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompatibilityBadge } from '@/components/wardrobe/CompatibilityBadge';
import { LookHarmonyBadge } from './LookHarmonyBadge';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import type { RecommendedLook } from '@/hooks/useLookRecommendations';

interface LookCardProps {
  look: RecommendedLook;
  index: number;
  onOpenInCanvas?: (look: RecommendedLook) => void;
}

export function LookCard({ look, index, onOpenInCanvas }: LookCardProps) {
  // Calculate chromatic stats
  const chromaticItems = look.items.map(item => ({
    chromatic_compatibility: item.chromatic_compatibility,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="overflow-hidden border-0 shadow-soft hover:shadow-elevated transition-shadow">
        {/* Items preview */}
        <div className="relative aspect-[4/3] bg-muted">
          <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-0.5">
            {look.items.slice(0, 4).map((item) => (
              <div key={item.id} className="relative overflow-hidden">
                <OptimizedImage
                  src={item.image_url}
                  alt={item.name || item.category}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 right-1">
                  <CompatibilityBadge 
                    compatibility={item.chromatic_compatibility} 
                    size="sm" 
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Harmony badge - TOP RIGHT */}
          <div className="absolute top-2 left-2 z-10">
            <LookHarmonyBadge 
              items={chromaticItems} 
              size="sm" 
              showPercentage
              harmonyType={look.harmony_type}
            />
          </div>
          
          {/* Look name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/80 to-transparent p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white">{look.name}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
              {look.occasion}
            </span>
            <span className="text-xs text-muted-foreground">
              {look.items.length} peças
            </span>
            {look.chromatic_score && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                <Palette className="w-3 h-3" />
                {look.chromatic_score}%
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {look.color_harmony}
          </p>

          {look.styling_tip && (
            <p className="text-xs text-primary italic">
              💡 {look.styling_tip}
            </p>
          )}

          {onOpenInCanvas && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full rounded-xl"
              onClick={() => onOpenInCanvas(look)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver no Canvas
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
