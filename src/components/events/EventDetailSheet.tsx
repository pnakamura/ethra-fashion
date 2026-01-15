import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar, Clock, MapPin, Trash2, Edit3, Sparkles, Loader2,
  Briefcase, PartyPopper, Heart, Users, Shirt, Gem, Plane, Star,
  ThermometerSun, CloudRain, Palette, CheckCircle, AlertCircle, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type UserEvent } from '@/hooks/useUserEvents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EditEventSheet } from './EditEventSheet';
import { EventLookSuggestion } from './EventLookSuggestion';
import type { Json } from '@/integrations/supabase/types';

const eventTypeIcons: Record<string, React.ComponentType<any>> = {
  meeting: Briefcase,
  party: PartyPopper,
  date: Heart,
  interview: Users,
  casual: Shirt,
  wedding: Gem,
  travel: Plane,
  work: Briefcase,
  special: Star,
};

const eventTypeLabels: Record<string, string> = {
  meeting: 'Reunião',
  party: 'Festa',
  date: 'Encontro',
  interview: 'Entrevista',
  casual: 'Casual',
  wedding: 'Casamento',
  travel: 'Viagem',
  work: 'Trabalho',
  special: 'Especial',
};

interface EventDetailSheetProps {
  event: UserEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (eventId: string) => void;
  onEventUpdated?: () => void;
}

export function EventDetailSheet({ event, isOpen, onClose, onDelete, onEventUpdated }: EventDetailSheetProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[] | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<any | null>(null);

  if (!event) return null;

  const Icon = eventTypeIcons[event.event_type] || Calendar;
  const existingSuggestions = event.ai_suggestions as any[] | null;
  const existingWeather = event.weather_info as any | null;
  
  const displaySuggestions = suggestions || existingSuggestions;
  const displayWeather = weatherInfo || existingWeather;

  const handleRequestLook = async () => {
    setIsAnalyzing(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error('Sessão expirada. Faça login novamente.');
        setIsAnalyzing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-event-look', {
        body: {
          title: event.title,
          eventDate: event.event_date,
          eventTime: event.event_time,
          eventType: event.event_type,
          dressCode: event.dress_code || 'casual',
          location: event.location,
          notes: event.notes
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        
        // Save to database
        await supabase.from('user_events')
          .update({ 
            ai_suggestions: data.suggestions as unknown as Json,
            weather_info: data.weather as unknown as Json || null
          })
          .eq('id', event.id);
        
        if (data.weather) {
          setWeatherInfo(data.weather);
        }
        
        toast.success('Sugestões de look geradas!');
        onEventUpdated?.();
      } else {
        toast.info(data?.message || 'Adicione mais peças ao closet para receber sugestões.');
      }
    } catch (error) {
      console.error('Error generating look:', error);
      toast.error('Erro ao gerar sugestões. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = () => {
    if (confirm(`Excluir "${event.title}"?`)) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl dark:border-primary/15 p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-full bg-primary/10 dark:bg-primary/20 flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="font-display text-lg text-left">
                  {event.title}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {eventTypeLabels[event.event_type] || event.event_type}
                  </Badge>
                  {event.dress_code && (
                    <Badge variant="outline" className="text-xs">
                      {event.dress_code}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="py-4 space-y-5">
              {/* Event Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(new Date(event.event_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                {event.event_time && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{event.event_time.slice(0, 5)}</span>
                  </div>
                )}
                
                {event.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              {event.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Notas</p>
                    <p className="text-sm text-muted-foreground">{event.notes}</p>
                  </div>
                </>
              )}

              {/* Weather Info */}
              {displayWeather && (
                <>
                  <Separator />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ThermometerSun className="w-4 h-4 text-sky-500" />
                      <span className="text-sm font-medium">Clima Previsto</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{displayWeather.temp_min}°C - {displayWeather.temp_max}°C</span>
                      {displayWeather.rain_probability > 30 && (
                        <span className="flex items-center gap-1 text-blue-500">
                          <CloudRain className="w-3 h-3" />
                          {displayWeather.rain_probability}% chuva
                        </span>
                      )}
                    </div>
                    {displayWeather.weather_consideration && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {displayWeather.weather_consideration}
                      </p>
                    )}
                  </motion.div>
                </>
              )}

              {/* Look Suggestions */}
              {displaySuggestions && displaySuggestions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Sugestões de Look</span>
                    </div>
                    
                    {displaySuggestions.map((suggestion, index) => (
                      <EventLookSuggestion 
                        key={index} 
                        suggestion={suggestion}
                        eventType={event.event_type}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Request Look Button */}
              {!displaySuggestions && (
                <>
                  <Separator />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <p className="text-sm text-muted-foreground mb-4">
                      Deixe a Aura sugerir o look perfeito para este evento
                    </p>
                    <Button
                      onClick={handleRequestLook}
                      disabled={isAnalyzing}
                      className="gradient-primary rounded-xl"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Consultando Aura...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Consultar Aura
                        </>
                      )}
                    </Button>
                  </motion.div>
                </>
              )}

              {/* Regenerate button if already has suggestions */}
              {displaySuggestions && displaySuggestions.length > 0 && (
                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRequestLook}
                    disabled={isAnalyzing}
                    className="text-muted-foreground"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Gerar novas sugestões
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          <SheetFooter className="px-6 py-4 border-t border-border/50 flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
            
            <EditEventSheet
              event={event}
              onEventUpdated={onEventUpdated}
              trigger={
                <Button variant="outline" className="flex-1 rounded-xl">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              }
            />
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
