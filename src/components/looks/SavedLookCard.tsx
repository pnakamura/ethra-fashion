import { Heart, Share2, Trash2, Palette } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  name?: string | null;
  chromatic_compatibility?: string | null;
}

interface Outfit {
  id: string;
  name: string;
  items: string[] | null;
  thumbnail_url?: string | null;
  occasion?: string | null;
  is_favorite?: boolean | null;
  created_at: string;
  shared_at?: string | null;
}

interface SavedLookCardProps {
  outfit: Outfit;
  items: WardrobeItem[];
  onOpen: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
}

// Calculate chromatic harmony stats
function calculateHarmonyStats(items: WardrobeItem[]) {
  const stats = {
    ideal: items.filter(i => i.chromatic_compatibility === 'ideal').length,
    neutral: items.filter(i => i.chromatic_compatibility === 'neutral').length,
    avoid: items.filter(i => i.chromatic_compatibility === 'avoid').length,
  };
  const total = items.length;
  const score = total > 0 
    ? Math.round(((stats.ideal * 100 + stats.neutral * 50) / (total * 100)) * 100)
    : 0;
  return { ...stats, score, total };
}

export function SavedLookCard({
  outfit,
  items,
  onOpen,
  onDelete,
  onToggleFavorite,
  onShare
}: SavedLookCardProps) {
  const itemCount = outfit.items?.length || items.length;
  const harmonyStats = calculateHarmonyStats(items);
  
  // Determine harmony badge style
  const getHarmonyStyle = () => {
    if (harmonyStats.avoid > 0) {
      return { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600', icon: '⚠️' };
    }
    if (harmonyStats.score >= 80) {
      return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', icon: '✨' };
    }
    if (harmonyStats.score >= 50) {
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', icon: '◐' };
    }
    return { bg: 'bg-muted', text: 'text-muted-foreground', icon: '○' };
  };

  const harmonyStyle = getHarmonyStyle();
  
  return (
    <Card className="overflow-hidden group shadow-soft hover:shadow-elevated transition-shadow">
      <button onClick={onOpen} className="w-full text-left">
        {/* Thumbnail or grid of pieces */}
        <div className="relative aspect-square bg-secondary">
          {outfit.thumbnail_url ? (
            <OptimizedImage
              src={outfit.thumbnail_url}
              alt={outfit.name}
              aspectRatio="square"
              className="w-full h-full object-cover"
            />
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 gap-0.5 p-0.5 h-full">
              {items.slice(0, 4).map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "relative overflow-hidden",
                    items.length === 1 && "col-span-2 row-span-2",
                    items.length === 3 && index === 0 && "col-span-2"
                  )}
                >
                  <OptimizedImage
                    src={item.image_url}
                    alt={item.name || item.category}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <span className="text-sm">Sem peças</span>
            </div>
          )}

          {/* Chromatic Harmony Badge - NEW */}
          {items.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1",
                    harmonyStyle.bg,
                    harmonyStyle.text
                  )}>
                    <Palette className="w-3 h-3" />
                    {harmonyStats.score}%
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium mb-1">Harmonia Cromática</p>
                  <div className="flex gap-2">
                    <span>{harmonyStats.ideal} ideais</span>
                    <span>{harmonyStats.neutral} neutras</span>
                    {harmonyStats.avoid > 0 && (
                      <span className="text-rose-500">{harmonyStats.avoid} evitar</span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                outfit.is_favorite
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground"
              )}
            />
          </button>

          {/* Shared indicator */}
          {outfit.shared_at && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
              Compartilhado
            </div>
          )}

          {/* Warning if has items to avoid */}
          {harmonyStats.avoid > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-rose-500/90 text-white text-[10px] font-medium">
              {harmonyStats.avoid} peça(s) a evitar
            </div>
          )}
        </div>
      </button>

      <div className="p-3">
        <p className="font-medium text-sm truncate font-display">{outfit.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {itemCount} {itemCount === 1 ? 'peça' : 'peças'} •{' '}
          {formatDistanceToNow(new Date(outfit.created_at), {
            addSuffix: true,
            locale: ptBR
          })}
        </p>

        {/* Actions - visible on hover */}
        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
          >
            <Share2 className="w-3.5 h-3.5 mr-1" />
            Compartilhar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
