import { motion } from 'framer-motion';
import { Sparkles, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LookHarmonyMini } from './LookHarmonyBadge';

interface LookItem {
  id: string;
  image_url?: string;
  imageUrl?: string;
  category?: string;
  chromatic_compatibility?: string | null;
}

interface Look {
  name: string;
  items: LookItem[];
  occasion?: string;
  harmony_explanation?: string;
  chromatic_score?: number;
}

interface LookCardCompactProps {
  look: Look;
  index?: number;
  onTryOn?: () => void;
  onOpenCanvas?: () => void;
}

export function LookCardCompact({
  look,
  index = 0,
  onTryOn,
  onOpenCanvas,
}: LookCardCompactProps) {
  const displayItems = look.items.slice(0, 3);

  // Prepare items for harmony calculation
  const chromaticItems = look.items.map(item => ({
    chromatic_compatibility: item.chromatic_compatibility,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex-shrink-0 w-48 snap-start"
    >
      <Card className="hover:shadow-lg transition-shadow">
        {/* Visual stack of items */}
        <div className="relative h-32 bg-gradient-to-br from-secondary to-secondary/50 overflow-hidden">
          {displayItems.map((item, i) => {
            const imageUrl = item.image_url || item.imageUrl;
            return (
              <motion.img
                key={item.id}
                src={imageUrl}
                alt=""
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="absolute w-16 h-16 object-cover rounded-lg shadow-md border border-background"
                style={{
                  left: `${8 + i * 22}%`,
                  top: `${12 + i * 18}%`,
                  transform: `rotate(${-6 + i * 6}deg)`,
                  zIndex: i,
                }}
              />
            );
          })}
          
          {/* Harmony badge - TOP LEFT */}
          <div className="absolute top-2 left-2 z-10">
            <LookHarmonyMini items={chromaticItems} />
          </div>
          
          {/* Item count badge */}
          {look.items.length > 3 && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-background/90 backdrop-blur rounded-full text-[10px] font-medium">
              +{look.items.length - 3}
            </div>
          )}
        </div>

        <div className="p-3 space-y-2">
          <div>
            <p className="font-medium text-sm truncate">{look.name}</p>
            <div className="flex items-center gap-1">
              <p className="text-[11px] text-muted-foreground truncate flex-1">
                {look.items.length} peças • {look.occasion || 'Casual'}
              </p>
              {look.chromatic_score && (
                <span className="text-[10px] text-primary font-medium">
                  {look.chromatic_score}%
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs px-1.5 min-w-0"
              onClick={onOpenCanvas}
            >
              <Sparkles className="w-3 h-3 flex-shrink-0" />
              <span className="hidden xs:inline ml-1 truncate">Canvas</span>
            </Button>
            <Button
              size="sm"
              className="flex-1 h-7 text-xs px-1.5 min-w-0 gradient-primary"
              onClick={onTryOn}
            >
              <Camera className="w-3 h-3 flex-shrink-0" />
              <span className="hidden xs:inline ml-1 truncate">Provar</span>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
