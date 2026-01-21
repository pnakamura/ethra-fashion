import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Shirt, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWardrobeItems } from '@/hooks/useWardrobeItems';

interface WardrobeSelectorProps {
  onSelect: (item: {
    id: string;
    name: string;
    imageUrl: string;
    category: string | null;
  }) => void;
  selectedId?: string;
}

export function WardrobeSelector({ onSelect, selectedId }: WardrobeSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Use centralized hook for consistent cache
  const { items, isLoading } = useWardrobeItems();

  const categories = items
    ? [...new Set(items.map((item) => item.category).filter(Boolean))]
    : [];

  const filteredItems = items?.filter((item) => {
    const matchesSearch = !search || (item.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (item.category || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <Card className="p-4 shadow-soft">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-secondary rounded-lg" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-secondary rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-soft">
      <h3 className="font-display text-lg font-medium mb-3">Meu Closet</h3>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar peça..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className="cursor-pointer flex-shrink-0"
            onClick={() => setSelectedCategory(null)}
          >
            Todas
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className="cursor-pointer flex-shrink-0"
              onClick={() => setSelectedCategory(cat as string)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      )}

      {/* Items Grid */}
      {filteredItems && filteredItems.length > 0 ? (
        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {filteredItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(index * 0.02, 0.4) }}
              onClick={() =>
                onSelect({
                  id: item.id,
                  name: item.name,
                  imageUrl: item.image_url || '',
                  category: item.category,
                })
              }
              className={`relative aspect-square rounded-lg overflow-hidden ring-2 transition-all ${
                selectedId === item.id
                  ? 'ring-primary'
                  : 'ring-transparent hover:ring-primary/50'
              }`}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Shirt className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              
              {selectedId === item.id && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-primary" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <Shirt className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {items?.length === 0
              ? 'Adicione peças ao seu closet'
              : 'Nenhuma peça encontrada'}
          </p>
        </div>
      )}
    </Card>
  );
}
