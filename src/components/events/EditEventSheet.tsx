import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, MessageSquare, Briefcase, PartyPopper, Heart, Users, Shirt, Gem, Plane, Star, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserEvents, type UserEvent } from '@/hooks/useUserEvents';
import { toast } from 'sonner';
import { format } from 'date-fns';

const eventTypes = [
  { value: 'meeting', label: 'Reunião', icon: Briefcase, color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
  { value: 'party', label: 'Festa', icon: PartyPopper, color: 'bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400' },
  { value: 'date', label: 'Encontro', icon: Heart, color: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' },
  { value: 'interview', label: 'Entrevista', icon: Users, color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
  { value: 'casual', label: 'Casual', icon: Shirt, color: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400' },
  { value: 'wedding', label: 'Casamento', icon: Gem, color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
  { value: 'travel', label: 'Viagem', icon: Plane, color: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400' },
  { value: 'special', label: 'Especial', icon: Star, color: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' },
] as const;

const dressCodes = [
  { value: 'casual', label: 'Casual' },
  { value: 'smart_casual', label: 'Smart Casual' },
  { value: 'casual_chic', label: 'Casual Chic' },
  { value: 'formal', label: 'Formal' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'black_tie', label: 'Black Tie' },
  { value: 'theme', label: 'Temático' },
];

interface EditEventSheetProps {
  event: UserEvent;
  trigger: React.ReactNode;
  onEventUpdated?: () => void;
}

export function EditEventSheet({ event, trigger, onEventUpdated }: EditEventSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { updateEvent } = useUserEvents();

  const [title, setTitle] = useState(event.title);
  const [eventDate, setEventDate] = useState(event.event_date);
  const [eventTime, setEventTime] = useState(event.event_time || '');
  const [eventType, setEventType] = useState<UserEvent['event_type']>(event.event_type);
  const [dressCode, setDressCode] = useState(event.dress_code || 'casual');
  const [location, setLocation] = useState(event.location || '');
  const [notes, setNotes] = useState(event.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when event changes
  useEffect(() => {
    setTitle(event.title);
    setEventDate(event.event_date);
    setEventTime(event.event_time || '');
    setEventType(event.event_type);
    setDressCode(event.dress_code || 'casual');
    setLocation(event.location || '');
    setNotes(event.notes || '');
  }, [event]);

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate) {
      toast.error('Preencha o título e a data');
      return;
    }

    setIsSubmitting(true);

    try {
      updateEvent({
        id: event.id,
        title: title.trim(),
        event_date: eventDate,
        event_time: eventTime || null,
        event_type: eventType,
        dress_code: dressCode,
        location: location.trim() || null,
        notes: notes.trim() || null,
      });

      toast.success('Evento atualizado!');
      onEventUpdated?.();
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Erro ao atualizar evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl dark:border-primary/15">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display">Editar Evento</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 overflow-y-auto pb-32 max-h-[calc(85vh-140px)]">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião com cliente"
              className="rounded-xl"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Data
              </label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Hora (opcional)
              </label>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label className="text-sm font-medium mb-3 block">Tipo de evento</label>
            <div className="grid grid-cols-4 gap-2">
              {eventTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = eventType === type.value;
                return (
                  <motion.button
                    key={type.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEventType(type.value as UserEvent['event_type'])}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 dark:border-primary/50 dark:shadow-[0_0_10px_hsl(45_100%_55%_/_0.1)]'
                        : 'border-border dark:border-primary/10 hover:border-primary/30 dark:hover:border-primary/30'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${type.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium">{type.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Dress Code */}
          <div>
            <label className="text-sm font-medium mb-2 block">Dress Code</label>
            <Select value={dressCode} onValueChange={setDressCode}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione o dress code" />
              </SelectTrigger>
              <SelectContent>
                {dressCodes.map((code) => (
                  <SelectItem key={code.value} value={code.value}>
                    {code.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Local (opcional)
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Escritório, Restaurante..."
              className="rounded-xl"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Notas (opcional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais sobre o evento..."
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-10 bg-gradient-to-t from-background via-background/98 to-transparent backdrop-blur-sm">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !eventDate}
            className="w-full rounded-xl gradient-primary"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
