import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { LookCanvas } from '@/components/canvas/LookCanvas';
import { SavedLooksGallery } from '@/components/looks/SavedLooksGallery';
import { ShareLookModal } from '@/components/looks/ShareLookModal';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateLookThumbnail } from '@/lib/look-image-generator';

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

interface CanvasItem {
  id: string;
  image_url: string;
  x: number;
  y: number;
  scale: number;
}

export default function Canvas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('create');
  const [preloadItems, setPreloadItems] = useState<{ id: string; image_url: string }[] | null>(null);
  const [shareOutfit, setShareOutfit] = useState<{ outfit: Outfit; items: WardrobeItem[] } | null>(null);

  // Fetch wardrobe items
  const { data: items = [] } = useQuery({
    queryKey: ['wardrobe-items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('wardrobe_items')
        .select('id, image_url, category, name')
        .eq('user_id', user.id);
      return (data || []) as WardrobeItem[];
    },
    enabled: !!user,
  });

  // Create items map for quick lookup
  const itemsMap = useMemo(() => {
    return Object.fromEntries(items.map(item => [item.id, item]));
  }, [items]);

  // Save look mutation
  const saveMutation = useMutation({
    mutationFn: async ({ name, itemIds }: { name: string; itemIds: string[] }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get items for thumbnail generation
      const itemsForThumbnail = itemIds
        .map(id => itemsMap[id])
        .filter(Boolean);
      
      // Generate thumbnail
      let thumbnailUrl: string | null = null;
      if (itemsForThumbnail.length > 0) {
        try {
          thumbnailUrl = await generateLookThumbnail(itemsForThumbnail);
        } catch (error) {
          console.error('Failed to generate thumbnail:', error);
        }
      }
      
      const { error } = await supabase.from('outfits').insert({
        user_id: user.id,
        name,
        items: itemIds,
        thumbnail_url: thumbnailUrl
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-outfits'] });
      toast({ title: 'Look salvo!', description: 'Seu look foi adicionado à coleção.' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('outfits')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-outfits'] });
    }
  });

  // Delete look mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('outfits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-outfits'] });
      toast({ title: 'Look removido' });
    }
  });

  // Handle save from canvas
  const handleSave = (canvasItems: CanvasItem[], name: string) => {
    // Extract original item IDs (remove timestamp suffix)
    const itemIds = canvasItems
      .map(item => item.id.split('-')[0])
      .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
    
    if (itemIds.length === 0) {
      toast({
        title: 'Canvas vazio',
        description: 'Adicione peças antes de salvar',
        variant: 'destructive'
      });
      return;
    }
    
    saveMutation.mutate({ name, itemIds });
  };

  // Handle opening a saved look in the canvas
  const handleOpenLook = (outfit: Outfit, outfitItems: WardrobeItem[]) => {
    setPreloadItems(outfitItems);
    setActiveTab('create');
    toast({
      title: 'Look carregado',
      description: `"${outfit.name}" foi aberto no canvas`
    });
  };

  // Handle sharing a look
  const handleShareLook = (outfit: Outfit, outfitItems: WardrobeItem[]) => {
    setShareOutfit({ outfit, items: outfitItems });
  };

  return (
    <>
      <Header title="Look Canvas" />
      <PageContainer className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="create" className="font-display">
                Criar Look
              </TabsTrigger>
              <TabsTrigger value="saved" className="font-display">
                Salvos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-0">
              <LookCanvas
                availableItems={items}
                onSave={handleSave}
                preloadItems={preloadItems}
              />
            </TabsContent>

            <TabsContent value="saved" className="mt-0">
              <SavedLooksGallery
                onOpenLook={handleOpenLook}
                onDeleteLook={(id) => deleteMutation.mutate(id)}
                onToggleFavorite={(id, isFavorite) => 
                  toggleFavoriteMutation.mutate({ id, isFavorite })
                }
                onShareLook={handleShareLook}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>

      {/* Share Modal */}
      <ShareLookModal
        outfit={shareOutfit?.outfit || null}
        items={shareOutfit?.items || []}
        onClose={() => setShareOutfit(null)}
      />

      <BottomNav />
    </>
  );
}
