import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { TripPlanner } from '@/components/voyager/TripPlanner';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Voyager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['wardrobe-items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('wardrobe_items').select('id, image_url, category').eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const createTrip = useMutation({
    mutationFn: async (trip: { destination: string; start_date: string; end_date: string; trip_type: string; packed_items: string[] }) => {
      if (!user) throw new Error('Not authenticated');
      await supabase.from('trips').insert({ user_id: user.id, ...trip });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Viagem criada!', description: 'Sua mala foi planejada com sucesso.' });
    },
  });

  return (
    <>
      <Header title="Voyager" />
      <PageContainer className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <TripPlanner 
            wardrobeItems={items} 
            onCreateTrip={(trip) => createTrip.mutate(trip)} 
            userId={user?.id}
          />
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}
