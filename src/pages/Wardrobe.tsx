import { useState } from 'react';
import { Plus, Filter, Check, Minus, AlertTriangle, Crown } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { AddItemSheet } from '@/components/wardrobe/AddItemSheet';
import { Button } from '@/components/ui/button';
import { UsageIndicator } from '@/components/subscription/UsageIndicator';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CompatibilityFilter = 'all' | 'ideal' | 'neutral' | 'avoid';

export default function Wardrobe() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [compatibilityFilter, setCompatibilityFilter] = useState<CompatibilityFilter>('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const wardrobePermission = usePermission('wardrobe_slots');

  const { data: items = [] } = useQuery({
    queryKey: ['wardrobe-items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const filteredItems = items.filter(item => {
    if (compatibilityFilter === 'all') return true;
    return item.chromatic_compatibility === compatibilityFilter;
  });

  interface DominantColor {
    hex: string;
    name: string;
    percentage: number;
  }

  const addMutation = useMutation({
    mutationFn: async (item: { 
      name: string; 
      category: string; 
      color_code: string; 
      season_tag: string; 
      occasion: string; 
      image_url: string;
      dominant_colors?: DominantColor[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('wardrobe_items').insert({
        user_id: user.id,
        name: item.name,
        category: item.category,
        color_code: item.color_code,
        season_tag: item.season_tag,
        occasion: item.occasion,
        image_url: item.image_url,
        dominant_colors: item.dominant_colors ? JSON.parse(JSON.stringify(item.dominant_colors)) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe-items'] });
      queryClient.invalidateQueries({ queryKey: ['wardrobe-count'] });
      toast({ title: 'Peça adicionada!', description: 'Sua peça foi salva no closet.' });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      await supabase.from('wardrobe_items').update({ is_favorite: !item.is_favorite }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wardrobe-items'] }),
  });

  const filterOptions = [
    { value: 'all', label: 'Todas', icon: null },
    { value: 'ideal', label: 'Ideais', icon: Check, color: 'text-emerald-600' },
    { value: 'neutral', label: 'Neutras', icon: Minus, color: 'text-amber-600' },
    { value: 'avoid', label: 'Evitar', icon: AlertTriangle, color: 'text-rose-600' },
  ];

  const activeFilter = filterOptions.find(f => f.value === compatibilityFilter);

  return (
    <>
      <Header title="Meu Closet" />
      <PageContainer className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-semibold">Suas Peças</h2>
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} {compatibilityFilter !== 'all' ? `de ${items.length}` : ''} itens
              </p>
            </div>
            <div className="flex items-center gap-3">
              <UsageIndicator feature="wardrobe_slots" compact />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={compatibilityFilter !== 'all' ? 'default' : 'outline'} 
                    size="icon" 
                    className="rounded-xl"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {filterOptions.map(option => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setCompatibilityFilter(option.value as CompatibilityFilter)}
                      className="flex items-center gap-2"
                    >
                      {option.icon && <option.icon className={`w-4 h-4 ${option.color}`} />}
                      <span>{option.label}</span>
                      {compatibilityFilter === option.value && (
                        <Check className="w-4 h-4 ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {wardrobePermission.hasAccess ? (
                <Button onClick={() => setIsAddOpen(true)} className="rounded-xl gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-1" /> Nova
                </Button>
              ) : (
                <Button onClick={() => navigate('/subscription')} variant="outline" className="rounded-xl">
                  <Crown className="w-4 h-4 mr-1" /> Upgrade
                </Button>
              )}

          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground mb-4">
                {compatibilityFilter !== 'all' 
                  ? `Nenhuma peça com compatibilidade "${activeFilter?.label}"`
                  : 'Seu closet está vazio'}
              </p>
              {compatibilityFilter !== 'all' ? (
                <Button onClick={() => setCompatibilityFilter('all')} variant="outline" className="rounded-xl">
                  Ver todas as peças
                </Button>
              ) : (
                <Button onClick={() => setIsAddOpen(true)} className="rounded-xl gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Peça
                </Button>
              )}
            </div>
          ) : (
            <WardrobeGrid items={filteredItems} onToggleFavorite={(id) => toggleFavorite.mutate(id)} />
          )}
        </div>
      </PageContainer>
      <BottomNav />
      <AddItemSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={(item) => addMutation.mutate(item)} />
    </>
  );
}
