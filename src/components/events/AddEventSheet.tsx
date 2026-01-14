import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, MessageSquare, Briefcase, PartyPopper, Heart, Users, Shirt, Gem, Plane, Star, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { useUserEvents, type CreateEventInput, type UserEvent } from '@/hooks/useUserEvents';
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

interface AddEventSheetProps {
  trigger: React.ReactNode;
  defaultDate?: Date;
  onEventCreated?: (event: UserEvent) => void;
}

export function AddEventSheet({ trigger, defaultDate, onEventCreated }: AddEventSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addEventAsync, isAdding } = useUserEvents();

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '');
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState<UserEvent['event_type']>('casual');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setTitle('');
    setEventDate(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '');
    setEventTime('');
    setEventType('casual');
    setLocation('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate) {
      toast.error('Preencha o título e a data');
      return;
    }

    try {
      const event = await addEventAsync({
        title: title.trim(),
        event_date: eventDate,
        event_time: eventTime || undefined,
        event_type: eventType,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success('Evento adicionado!');
      onEventCreated?.(event);
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Erro ao adicionar evento');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl dark:border-primary/15">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display">Novo Evento</SheetTitle>
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

          {/* Notification Badge */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/25">
            <div className="p-2 rounded-full bg-amber-500/20 dark:bg-amber-500/25">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Lembrete automático
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                Você receberá uma notificação antes do evento
              </p>
            </div>
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-10 bg-gradient-to-t from-background via-background/98 to-transparent backdrop-blur-sm">
          <Button
            onClick={handleSubmit}
            disabled={isAdding || !title.trim() || !eventDate}
            className="w-full rounded-xl gradient-primary"
          >
            {isAdding ? 'Salvando...' : 'Adicionar Evento'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
