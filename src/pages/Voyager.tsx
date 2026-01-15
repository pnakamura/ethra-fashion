import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { TripPlanner } from '@/components/voyager/TripPlanner';
import { TripList } from '@/components/voyager/TripList';
import { TripDetailSheet } from '@/components/voyager/TripDetailSheet';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { downloadPackingListPDF } from '@/lib/pdf-generator';
import { openGoogleCalendar } from '@/lib/google-calendar';
import type { PackingList } from '@/components/voyager/PackingChecklist';
import type { Json } from '@/integrations/supabase/types';

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  trip_type: string;
  packed_items: string[];
  packing_list?: PackingList | null;
}

// Helper to safely parse packing list from JSON
function parsePackingList(json: Json | null): PackingList | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  if (
    Array.isArray(obj.roupas) &&
    Array.isArray(obj.calcados) &&
    Array.isArray(obj.acessorios) &&
    Array.isArray(obj.chapeus)
  ) {
    return obj as unknown as PackingList;
  }
  return null;
}

export default function Voyager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [view, setView] = useState<'list' | 'new'>('list');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch wardrobe items
  const { data: items = [] } = useQuery({
    queryKey: ['wardrobe-items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('wardrobe_items')
        .select('id, image_url, category, name')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch trips
  const { data: trips = [] } = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });
      return (data || []).map(row => ({
        id: row.id,
        destination: row.destination,
        start_date: row.start_date,
        end_date: row.end_date,
        trip_type: row.trip_type || 'leisure',
        packed_items: row.packed_items || [],
        packing_list: parsePackingList(row.packing_list),
      })) as Trip[];
    },
    enabled: !!user,
  });

  // Create trip mutation
  const createTrip = useMutation({
    mutationFn: async (trip: { 
      destination: string; 
      start_date: string; 
      end_date: string; 
      trip_type: string; 
      packed_items: string[];
      packing_list?: PackingList;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Validate packed_items - only allow valid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validPackedItems = trip.packed_items.filter(id => uuidRegex.test(id));
      
      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        trip_type: trip.trip_type,
        packed_items: validPackedItems,
        packing_list: trip.packing_list as unknown as Json,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Viagem criada!', description: 'Sua mala foi planejada com sucesso.' });
      setView('list');
    },
    onError: (error) => {
      console.error('Error creating trip:', error);
      toast({ 
        title: 'Erro ao criar viagem', 
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    },
  });

  // Update trip mutation
  const updateTrip = useMutation({
    mutationFn: async ({ tripId, updates }: { tripId: string; updates: Partial<Trip> }) => {
      if (!user) throw new Error('Not authenticated');
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.packing_list) {
        dbUpdates.packing_list = updates.packing_list as unknown as Json;
      }
      const { error } = await supabase
        .from('trips')
        .update(dbUpdates)
        .eq('id', tripId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Viagem atualizada!' });
    },
    onError: (error) => {
      console.error('Error updating trip:', error);
      toast({ 
        title: 'Erro ao atualizar', 
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    },
  });

  // Delete trip mutation
  const deleteTrip = useMutation({
    mutationFn: async (tripId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Viagem excluída!' });
    },
    onError: (error) => {
      console.error('Error deleting trip:', error);
      toast({ 
        title: 'Erro ao excluir', 
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    },
  });

  const handleExportPDF = async (trip: Trip) => {
    setIsExporting(true);
    try {
      await downloadPackingListPDF(trip);
      toast({ title: 'PDF gerado!', description: 'Use Ctrl+P para salvar como PDF.' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ 
        title: 'Erro ao exportar', 
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddToCalendar = (trip: Trip) => {
    try {
      openGoogleCalendar(trip);
      toast({ title: 'Abrindo Google Calendar...', description: 'Confirme o evento na nova aba.' });
    } catch (error) {
      console.error('Error opening calendar:', error);
      toast({ 
        title: 'Erro ao abrir calendário', 
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTrip = (tripId: string, updates: Partial<Trip>) => {
    updateTrip.mutate({ tripId, updates });
    // Update local selected trip state
    if (selectedTrip && selectedTrip.id === tripId) {
      setSelectedTrip({ ...selectedTrip, ...updates });
    }
  };

  const handleDeleteTrip = (tripId: string) => {
    deleteTrip.mutate(tripId);
    setSelectedTrip(null);
  };

  return (
    <>
      <Header title="Voyager" />
      <PageContainer className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          {view === 'list' ? (
            <TripList
              trips={trips}
              onSelectTrip={(trip) => setSelectedTrip(trip)}
              onNewTrip={() => setView('new')}
            />
          ) : (
            <TripPlanner 
              wardrobeItems={items} 
              onCreateTrip={(trip) => createTrip.mutate(trip)} 
              userId={user?.id}
            />
          )}
        </div>
      </PageContainer>
      
      <TripDetailSheet
        trip={selectedTrip}
        open={!!selectedTrip}
        onOpenChange={(open) => !open && setSelectedTrip(null)}
        wardrobeItems={items}
        onUpdateTrip={handleUpdateTrip}
        onDeleteTrip={handleDeleteTrip}
        onExportPDF={handleExportPDF}
        onAddToCalendar={handleAddToCalendar}
        isExporting={isExporting}
      />
      
      <BottomNav />
    </>
  );
}
