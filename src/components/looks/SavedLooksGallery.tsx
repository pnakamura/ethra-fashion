import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, FolderOpen, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SavedLookCard } from './SavedLookCard';

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

interface SavedLooksGalleryProps {
  onOpenLook: (outfit: Outfit, items: WardrobeItem[]) => void;
  onDeleteLook: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onShareLook: (outfit: Outfit, items: WardrobeItem[]) => void;
}

export function SavedLooksGallery({
  onOpenLook,
  onDeleteLook,
  onToggleFavorite,
  onShareLook
}: SavedLooksGalleryProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  // Fetch saved outfits
  const { data: outfits = [], isLoading: isLoadingOutfits } = useQuery({
    queryKey: ['saved-outfits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('outfits')
        .select('id, name, items, thumbnail_url, occasion, is_favorite, created_at, shared_at')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Outfit[];
    },
    enabled: !!user
  });

  // Collect all item IDs from all outfits
  const allItemIds = [...new Set(outfits.flatMap(o => o.items || []))];

  // Fetch wardrobe items details
  const { data: itemsMap = {} } = useQuery({
    queryKey: ['outfit-items-details', allItemIds.join(',')],
    queryFn: async () => {
      if (allItemIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('id, image_url, category, name')
        .in('id', allItemIds);
      
      if (error) throw error;
      
      return Object.fromEntries(
        (data || []).map(item => [item.id, item as WardrobeItem])
      );
    },
    enabled: allItemIds.length > 0
  });

  // Filter outfits based on selected tab
  const filteredOutfits = filter === 'favorites'
    ? outfits.filter(o => o.is_favorite)
    : outfits;

  // Get items for a specific outfit
  const getOutfitItems = (outfit: Outfit): WardrobeItem[] => {
    return (outfit.items || [])
      .map(id => itemsMap[id])
      .filter(Boolean) as WardrobeItem[];
  };

  if (isLoadingOutfits) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs for filtering */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium font-display text-lg">Meus Looks</h3>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'favorites')}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3 h-6">
              Todos ({outfits.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs px-3 h-6">
              <Heart className="w-3 h-3 mr-1" />
              Favoritos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Empty state */}
      {filteredOutfits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-2xl bg-secondary mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-display text-lg font-medium mb-1">
            {filter === 'favorites' ? 'Nenhum favorito' : 'Nenhum look salvo'}
          </p>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            {filter === 'favorites'
              ? 'Marque looks com ♥ para vê-los aqui'
              : 'Crie looks arrastando peças para o canvas'}
          </p>
        </div>
      ) : (
        /* Grid of saved looks */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredOutfits.map(outfit => (
            <SavedLookCard
              key={outfit.id}
              outfit={outfit}
              items={getOutfitItems(outfit)}
              onOpen={() => onOpenLook(outfit, getOutfitItems(outfit))}
              onDelete={() => onDeleteLook(outfit.id)}
              onToggleFavorite={() => onToggleFavorite(outfit.id, outfit.is_favorite || false)}
              onShare={() => onShareLook(outfit, getOutfitItems(outfit))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
