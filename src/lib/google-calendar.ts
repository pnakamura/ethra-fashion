import { format } from 'date-fns';
import type { PackingList } from '@/components/voyager/PackingChecklist';

interface TripData {
  destination: string;
  start_date: string;
  end_date: string;
  trip_type: string;
  packing_list?: PackingList | null;
}

const tripTypeLabels: Record<string, string> = {
  leisure: 'Lazer',
  business: 'Negócios',
  adventure: 'Aventura',
  romantic: 'Romântica',
  beach: 'Praia',
};

function formatDateForGCal(dateStr: string): string {
  // Google Calendar expects YYYYMMDD format for all-day events
  return format(new Date(dateStr), 'yyyyMMdd');
}

function generatePackingListText(packingList: PackingList): string {
  const sections: string[] = [];

  const categories = [
    { key: 'roupas', label: '👕 Roupas' },
    { key: 'calcados', label: '👟 Calçados' },
    { key: 'acessorios', label: '⌚ Acessórios' },
    { key: 'chapeus', label: '👑 Chapéus' },
  ] as const;

  for (const { key, label } of categories) {
    const items = packingList[key];
    if (items.length > 0) {
      const itemList = items
        .map(item => `  • ${item.name} (x${item.quantity})${item.in_wardrobe ? ' ✓' : ' 🛒'}`)
        .join('\n');
      sections.push(`${label}:\n${itemList}`);
    }
  }

  return sections.join('\n\n');
}

export function generateGoogleCalendarUrl(trip: TripData): string {
  const startDate = formatDateForGCal(trip.start_date);
  // End date needs to be the day AFTER for all-day events
  const endDate = formatDateForGCal(
    new Date(new Date(trip.end_date).getTime() + 24 * 60 * 60 * 1000).toISOString()
  );

  const title = `✈️ Viagem: ${trip.destination}`;
  
  let description = `Viagem de ${tripTypeLabels[trip.trip_type] || trip.trip_type}\n\n`;
  
  if (trip.packing_list) {
    const allItems = [
      ...trip.packing_list.roupas,
      ...trip.packing_list.calcados,
      ...trip.packing_list.acessorios,
      ...trip.packing_list.chapeus,
    ];
    
    const inWardrobe = allItems.filter(i => i.in_wardrobe).length;
    const suggestions = allItems.filter(i => !i.in_wardrobe).length;
    
    description += `📦 CHECKLIST DA MALA\n`;
    description += `${allItems.length} itens total | ${inWardrobe} no closet | ${suggestions} sugestões\n\n`;
    description += generatePackingListText(trip.packing_list);
  }

  description += '\n\n---\nGerado por Aura ✨';

  // Build Google Calendar URL
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDate}/${endDate}`,
    details: description,
    location: trip.destination,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function openGoogleCalendar(trip: TripData): void {
  const url = generateGoogleCalendarUrl(trip);
  window.open(url, '_blank', 'noopener,noreferrer');
}
