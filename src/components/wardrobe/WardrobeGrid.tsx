import { motion } from 'framer-motion';
import { Heart, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CompatibilityBadge } from './CompatibilityBadge';

interface WardrobeItem {
  id: string;
  image_url: string;
  name?: string;
  category: string;
  is_favorite: boolean;
  chromatic_compatibility?: string | null;
}

interface WardrobeGridProps {
  items: WardrobeItem[];
  onToggleFavorite: (id: string) => void;
}

export function WardrobeGrid({ items, onToggleFavorite }: WardrobeGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Card className="overflow-hidden border-0 shadow-soft group">
            <div className="relative aspect-square bg-muted">
              <img
                src={item.image_url}
                alt={item.name || item.category}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Compatibility badge - always visible */}
              <div className="absolute top-2 left-2">
                <CompatibilityBadge compatibility={item.chromatic_compatibility} />
              </div>
              
              {/* Actions overlay */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onToggleFavorite(item.id)}
                  className="p-2 rounded-full bg-card/80 backdrop-blur-sm"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      item.is_favorite ? 'fill-primary text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </button>
                <button className="p-2 rounded-full bg-card/80 backdrop-blur-sm">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-foreground truncate">
                {item.name || 'Sem nome'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {item.category}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
