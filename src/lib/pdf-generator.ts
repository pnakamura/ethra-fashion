import type { PackingList, PackingItem } from '@/components/voyager/PackingChecklist';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const categoryLabels: Record<string, string> = {
  roupas: '👕 Roupas',
  calcados: '👟 Calçados',
  acessorios: '⌚ Acessórios',
  chapeus: '👑 Chapéus',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateItemRow(item: PackingItem, index: number): string {
  const statusColor = item.in_wardrobe ? '#10b981' : '#f59e0b';
  const statusText = item.in_wardrobe ? '✓ No closet' : '🛒 Sugestão';
  
  return `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; text-align: center; color: #6b7280;">${index + 1}</td>
      <td style="padding: 12px 8px;">
        <strong>${escapeHtml(item.name)}</strong>
        <br>
        <span style="font-size: 12px; color: #6b7280;">${escapeHtml(item.category)}</span>
      </td>
      <td style="padding: 12px 8px; text-align: center;">x${item.quantity}</td>
      <td style="padding: 12px 8px;">
        ${item.colors.slice(0, 3).map(color => 
          `<span style="display: inline-block; width: 16px; height: 16px; border-radius: 50%; background: ${color.startsWith('#') ? color : '#' + color}; margin-right: 4px; border: 1px solid #e5e7eb;"></span>`
        ).join('')}
      </td>
      <td style="padding: 12px 8px;">
        ${item.styles.slice(0, 2).map(style => 
          `<span style="display: inline-block; padding: 2px 8px; background: #f3f4f6; border-radius: 12px; font-size: 11px; margin-right: 4px;">${escapeHtml(style)}</span>`
        ).join('')}
      </td>
      <td style="padding: 12px 8px; text-align: center;">
        <span style="color: ${statusColor}; font-weight: 500; font-size: 12px;">${statusText}</span>
      </td>
    </tr>
  `;
}

function generateCategorySection(category: keyof PackingList, items: PackingItem[]): string {
  if (items.length === 0) return '';

  return `
    <div style="margin-bottom: 32px; page-break-inside: avoid;">
      <h3 style="font-size: 18px; color: #374151; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #6366f1;">
        ${categoryLabels[category]}
        <span style="font-weight: normal; color: #6b7280; font-size: 14px;"> (${items.length} itens)</span>
      </h3>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px 8px; text-align: center; width: 40px;">#</th>
            <th style="padding: 12px 8px; text-align: left;">Item</th>
            <th style="padding: 12px 8px; text-align: center; width: 60px;">Qtd</th>
            <th style="padding: 12px 8px; text-align: left; width: 100px;">Cores</th>
            <th style="padding: 12px 8px; text-align: left; width: 120px;">Estilo</th>
            <th style="padding: 12px 8px; text-align: center; width: 100px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, idx) => generateItemRow(item, idx)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function generatePackingListHTML(trip: TripData): string {
  const startDate = format(new Date(trip.start_date), "d 'de' MMMM", { locale: ptBR });
  const endDate = format(new Date(trip.end_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const tripDays = Math.ceil(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const packingList = trip.packing_list || { roupas: [], calcados: [], acessorios: [], chapeus: [] };
  
  const allItems = [
    ...packingList.roupas,
    ...packingList.calcados,
    ...packingList.acessorios,
    ...packingList.chapeus,
  ];
  
  const totalItems = allItems.length;
  const inWardrobe = allItems.filter(i => i.in_wardrobe).length;
  const suggestions = allItems.filter(i => !i.in_wardrobe).length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lista de Viagem - ${escapeHtml(trip.destination)}</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1f2937;
          line-height: 1.5;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 24px;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #6366f1;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6366f1; margin-bottom: 8px;">
          Lista de Viagem
        </div>
        <h1 style="font-size: 32px; margin: 0 0 8px 0; color: #111827;">
          ✈️ ${escapeHtml(trip.destination)}
        </h1>
        <p style="font-size: 16px; color: #6b7280; margin: 0;">
          ${startDate} a ${endDate} • ${tripDays} dias • ${tripTypeLabels[trip.trip_type] || trip.trip_type}
        </p>
      </div>

      <!-- Summary Cards -->
      <div style="display: flex; gap: 16px; margin-bottom: 32px;">
        <div style="flex: 1; padding: 16px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; color: white; text-align: center;">
          <div style="font-size: 28px; font-weight: bold;">${totalItems}</div>
          <div style="font-size: 12px; opacity: 0.9;">Total de Itens</div>
        </div>
        <div style="flex: 1; padding: 16px; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); border-radius: 12px; color: white; text-align: center;">
          <div style="font-size: 28px; font-weight: bold;">${inWardrobe}</div>
          <div style="font-size: 12px; opacity: 0.9;">No Closet</div>
        </div>
        <div style="flex: 1; padding: 16px; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); border-radius: 12px; color: white; text-align: center;">
          <div style="font-size: 28px; font-weight: bold;">${suggestions}</div>
          <div style="font-size: 12px; opacity: 0.9;">Sugestões</div>
        </div>
      </div>

      <!-- Categories -->
      ${generateCategorySection('roupas', packingList.roupas)}
      ${generateCategorySection('calcados', packingList.calcados)}
      ${generateCategorySection('acessorios', packingList.acessorios)}
      ${generateCategorySection('chapeus', packingList.chapeus)}

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>Gerado por Aura • ${format(new Date(), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
        <p style="margin-top: 8px;">✨ Boa viagem!</p>
      </div>
    </body>
    </html>
  `;
}

export async function downloadPackingListPDF(trip: TripData): Promise<void> {
  const html = generatePackingListHTML(trip);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Popup bloqueado. Permita popups para baixar o PDF.');
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}
