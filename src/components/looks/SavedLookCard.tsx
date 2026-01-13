import { Heart, Share2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  name?: string | null;
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

export function SavedLookCard({
  outfit,
  items,
  onOpen,
  onDelete,
  onToggleFavorite,
  onShare
}: SavedLookCardProps) {
  const itemCount = outfit.items?.length || items.length;
  
  return (
    <Card className="overflow-hidden group shadow-soft hover:shadow-elevated transition-shadow">
      <button onClick={onOpen} className="w-full text-left">
        {/* Thumbnail or grid of pieces */}
        <div className="relative aspect-square bg-secondary">
          {outfit.thumbnail_url ? (
            <img
              src={outfit.thumbnail_url}
              alt={outfit.name}
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
                  <img
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
