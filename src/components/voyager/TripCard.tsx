import { motion } from 'framer-motion';
import { MapPin, Calendar, Plane, ChevronRight, Shirt } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PackingList } from './PackingChecklist';

interface TripCardProps {
  trip: {
    id: string;
    destination: string;
    start_date: string;
    end_date: string;
    trip_type: string;
    packed_items: string[];
    packing_list?: PackingList | null;
  };
  onClick: () => void;
}

const tripTypeLabels: Record<string, string> = {
  leisure: 'Lazer',
  business: 'Negócios',
  adventure: 'Aventura',
  romantic: 'Romântica',
  beach: 'Praia',
};

export function TripCard({ trip, onClick }: TripCardProps) {
  const tripDays = Math.ceil(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const totalItems = trip.packing_list
    ? [
        ...trip.packing_list.roupas,
        ...trip.packing_list.calcados,
        ...trip.packing_list.acessorios,
        ...trip.packing_list.chapeus,
      ].length
    : trip.packed_items?.length || 0;

  const isUpcoming = new Date(trip.start_date) >= new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className="p-4 cursor-pointer border-0 shadow-soft hover:shadow-md transition-all group"
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Plane className="w-6 h-6 text-primary" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-semibold truncate">{trip.destination}</h3>
              {isUpcoming && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                  Próxima
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(trip.start_date), "d MMM", { locale: ptBR })}
              </span>
              <span>•</span>
              <span>{tripDays} dias</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Shirt className="w-3.5 h-3.5" />
                {totalItems} itens
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Trip type badge */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <Badge variant="outline" className="text-xs">
            {tripTypeLabels[trip.trip_type] || trip.trip_type}
          </Badge>
        </div>
      </Card>
    </motion.div>
  );
}
