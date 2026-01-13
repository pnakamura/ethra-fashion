import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting event reminder generation...');

    // Get current time
    const now = new Date();
    
    // Fetch all users with event reminders enabled
    const { data: prefsData, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, event_reminder_hours, event_reminders_enabled')
      .eq('event_reminders_enabled', true);

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
      throw prefsError;
    }

    console.log(`Found ${prefsData?.length || 0} users with event reminders enabled`);

    let notificationsCreated = 0;

    for (const pref of prefsData || []) {
      const reminderHours = pref.event_reminder_hours || 2;
      
      // Calculate the time window for reminders
      const reminderTime = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);
      const reminderDate = reminderTime.toISOString().split('T')[0];
      const reminderTimeStr = reminderTime.toISOString().split('T')[1].substring(0, 5);

      // Find events that need reminders
      // Events where: event_date = reminderDate AND event_time <= reminderTimeStr AND is_notified = false
      const { data: events, error: eventsError } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', pref.user_id)
        .eq('event_date', reminderDate)
        .eq('is_notified', false)
        .lte('event_time', reminderTimeStr);

      if (eventsError) {
        console.error(`Error fetching events for user ${pref.user_id}:`, eventsError);
        continue;
      }

      for (const event of events || []) {
        // Check if this event hasn't been reminded yet
        if (event.reminder_sent_at) continue;

        // Create notification
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: event.user_id,
            type: 'event_reminder',
            title: `Lembrete: ${event.title}`,
            message: event.is_special_event 
              ? `Seu evento especial "${event.title}" é em ${reminderHours}h! Confira o look sugerido pela Aura.`
              : `Você tem "${event.title}" em ${reminderHours}h${event.location ? ` em ${event.location}` : ''}.`,
            data: {
              event_id: event.id,
              event_type: event.event_type,
              event_time: event.event_time,
              event_date: event.event_date,
              location: event.location,
              is_special_event: event.is_special_event,
              dress_code: event.dress_code,
            }
          });

        if (notifError) {
          console.error(`Error creating notification for event ${event.id}:`, notifError);
          continue;
        }

        // Mark event as reminded
        const { error: updateError } = await supabase
          .from('user_events')
          .update({ 
            reminder_sent_at: now.toISOString(),
            is_notified: true 
          })
          .eq('id', event.id);

        if (updateError) {
          console.error(`Error updating event ${event.id}:`, updateError);
          continue;
        }

        notificationsCreated++;
        console.log(`Created reminder for event: ${event.title} (user: ${event.user_id})`);
      }
    }

    console.log(`Event reminder generation complete. Created ${notificationsCreated} notifications.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_created: notificationsCreated,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-event-reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
