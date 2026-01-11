import { motion } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface SuggestedLook {
  occasion: string;
  items: string[];
  description: string;
}

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
}

interface SuggestedLooksProps {
  looks: SuggestedLook[];
  wardrobeItems: WardrobeItem[];
  onAddLook: (itemIds: string[]) => void;
  selectedItems: string[];
}

export function SuggestedLooks({ looks, wardrobeItems, onAddLook, selectedItems }: SuggestedLooksProps) {
  if (looks.length === 0) return null;

  const getItemImage = (itemId: string): string | null => {
    const item = wardrobeItems.find((w) => w.id === itemId);
    return item?.image_url || null;
  };

  const isLookAdded = (look: SuggestedLook): boolean => {
    return look.items.every((id) => selectedItems.includes(id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-medium">Looks Sugeridos</h4>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {looks.map((look, index) => {
            const lookImages = look.items
              .map(getItemImage)
              .filter((img): img is string => img !== null)
              .slice(0, 4);
            const added = isLookAdded(look);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  className={`flex-shrink-0 w-48 p-3 border-0 shadow-soft transition-all ${
                    added ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                >
                  {/* Look Images Grid */}
                  <div className="grid grid-cols-2 gap-1 mb-3">
                    {lookImages.map((img, imgIndex) => (
                      <div
                        key={imgIndex}
                        className="aspect-square rounded-lg overflow-hidden bg-muted"
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {lookImages.length < 4 &&
                      Array.from({ length: 4 - lookImages.length }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-square rounded-lg bg-muted/50"
                        />
                      ))}
                  </div>

                  {/* Look Info */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-primary capitalize">
                      {look.occasion}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {look.description}
                    </p>
                  </div>

                  {/* Add Button */}
                  <Button
                    size="sm"
                    variant={added ? 'secondary' : 'default'}
                    className="w-full mt-3 h-8 text-xs rounded-lg"
                    onClick={() => onAddLook(look.items)}
                    disabled={added}
                  >
                    {added ? (
                      'Adicionado'
                    ) : (
                      <>
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar à Mala
                      </>
                    )}
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </motion.div>
  );
}
