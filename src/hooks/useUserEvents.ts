import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface UserEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  event_time?: string | null;
  event_type: 'meeting' | 'party' | 'date' | 'interview' | 'casual' | 'wedding' | 'travel' | 'work' | 'special';
  location?: string | null;
  notes?: string | null;
  is_notified: boolean | null;
  created_at: string | null;
  // Extended fields from database
  dress_code?: string | null;
  expected_attendees?: string | null;
  is_special_event?: boolean | null;
  outfit_id?: string | null;
  reminder_sent_at?: string | null;
  ai_suggestions?: any | null;
  weather_info?: any | null;
}

export interface CreateEventInput {
  title: string;
  event_date: string;
  event_time?: string;
  event_type: UserEvent['event_type'];
  location?: string;
  notes?: string;
  dress_code?: string;
  expected_attendees?: string;
  is_special_event?: boolean;
}

export function useUserEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['user-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!user,
  });

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.event_date === dateStr);
  };

  // Get today's events
  const todaysEvents = events.filter(e => 
    e.event_date === format(new Date(), 'yyyy-MM-dd')
  );

  // Get upcoming events (next 7 days)
  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.event_date);
    const today = startOfDay(new Date());
    const nextWeek = endOfDay(addDays(today, 7));
    return eventDate >= today && eventDate <= nextWeek;
  });

  const addEvent = useMutation({
    mutationFn: async (input: CreateEventInput) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_events')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: async (event) => {
      queryClient.invalidateQueries({ queryKey: ['user-events', user?.id] });
      
      // Create confirmation notification
      if (user) {
        const formattedDate = format(new Date(event.event_date), "d 'de' MMMM", { locale: ptBR });
        const timeInfo = event.event_time ? ` às ${event.event_time}` : '';
        
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'event_reminder',
          title: '📅 Evento agendado!',
          message: `"${event.title}" foi adicionado à sua agenda para ${formattedDate}${timeInfo}.`,
          data: {
            event_id: event.id,
            event_type: event.event_type,
            event_date: event.event_date,
            event_time: event.event_time || null,
          }
        });
        
        // Invalidate notifications to show the new one
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      }
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as UserEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events', user?.id] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events', user?.id] });
    },
  });

  return {
    events,
    isLoading,
    todaysEvents,
    upcomingEvents,
    getEventsForDate,
    addEvent: addEvent.mutate,
    addEventAsync: addEvent.mutateAsync,
    updateEvent: updateEvent.mutate,
    deleteEvent: deleteEvent.mutate,
    isAdding: addEvent.isPending,
    refetch,
  };
}
