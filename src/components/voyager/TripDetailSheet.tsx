import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Calendar, Plane, Download, Plus, Trash2, 
  Check, ShoppingBag, Loader2, X, Save, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PackingList, PackingItem } from './PackingChecklist';

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  trip_type: string;
  packed_items: string[];
  packing_list?: PackingList | null;
}

interface TripDetailSheetProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wardrobeItems: { id: string; image_url: string; category: string; name?: string }[];
  onUpdateTrip: (tripId: string, updates: Partial<Trip>) => void;
  onDeleteTrip: (tripId: string) => void;
  onExportPDF: (trip: Trip) => void;
  onAddToCalendar: (trip: Trip) => void;
  isExporting?: boolean;
}

const categoryLabels: Record<string, string> = {
  roupas: 'Roupas',
  calcados: 'Calçados',
  acessorios: 'Acessórios',
  chapeus: 'Chapéus',
};

// Simple item row component
function SimplePackingItem({
  item,
  onDelete,
  wardrobeImage,
}: {
  item: PackingItem;
  onDelete: () => void;
  wardrobeImage?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
    >
      {/* Image or icon */}
      {item.in_wardrobe && wardrobeImage ? (
        <img 
          src={wardrobeImage} 
          alt={item.name} 
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-4 h-4 text-amber-500" />
        </div>
      )}

      {/* Name and category */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.category}</span>
          {item.quantity > 1 && <span>• x{item.quantity}</span>}
          {item.in_wardrobe ? (
            <span className="text-emerald-600">✓ Closet</span>
          ) : (
            <span className="text-amber-600">Sugestão</span>
          )}
        </div>
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}

// Add item form - simplified
function AddItemInline({
  onAdd,
  wardrobeItems,
}: {
  onAdd: (item: PackingItem) => void;
  wardrobeItems: { id: string; image_url: string; category: string; name?: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedWardrobeItem, setSelectedWardrobeItem] = useState<string>('');

  const handleAdd = () => {
    if (!name.trim() && !selectedWardrobeItem) return;

    const wardrobeItem = wardrobeItems.find(i => i.id === selectedWardrobeItem);
    
    const newItem: PackingItem = {
      id: selectedWardrobeItem || undefined,
      name: wardrobeItem?.name || name || 'Item',
      category: wardrobeItem?.category || 'Outros',
      quantity: 1,
      colors: [],
      styles: [],
      fabrics: [],
      in_wardrobe: !!selectedWardrobeItem,
      image_url: wardrobeItem?.image_url,
      reason: 'Adicionado manualmente',
    };

    onAdd(newItem);
    setName('');
    setSelectedWardrobeItem('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar item
      </Button>
    );
  }

  return (
    <div className="flex gap-2 py-2">
      <Select value={selectedWardrobeItem} onValueChange={(v) => {
        setSelectedWardrobeItem(v === '__none__' ? '' : v);
        if (v && v !== '__none__') setName('');
      }}>
        <SelectTrigger className="flex-1 rounded-xl text-sm h-9">
          <SelectValue placeholder="Do closet ou digite..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Digitar manualmente</SelectItem>
          {wardrobeItems.map(item => (
            <SelectItem key={item.id} value={item.id}>
              {item.name || item.category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedWardrobeItem && (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do item"
          className="flex-1 rounded-xl text-sm h-9"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
      )}

      <Button size="sm" className="h-9 rounded-xl" onClick={handleAdd}>
        <Check className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-9" onClick={() => setIsOpen(false)}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function TripDetailSheet({
  trip,
  open,
  onOpenChange,
  wardrobeItems,
  onUpdateTrip,
  onDeleteTrip,
  onExportPDF,
  onAddToCalendar,
  isExporting = false,
}: TripDetailSheetProps) {
  const [localPackingList, setLocalPackingList] = useState<PackingList | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize local state when trip changes - FIXED: using useEffect instead of useState
  useEffect(() => {
    if (trip?.packing_list) {
      setLocalPackingList(trip.packing_list);
    } else {
      setLocalPackingList(null);
    }
    setHasChanges(false);
  }, [trip?.id, trip?.packing_list]);

  if (!trip) return null;

  // Flatten all items from packing_list
  const packingList = localPackingList || trip.packing_list;
  
  const allItems: { item: PackingItem; category: string; index: number }[] = packingList
    ? [
        ...packingList.roupas.map((item, index) => ({ item, category: 'roupas', index })),
        ...packingList.calcados.map((item, index) => ({ item, category: 'calcados', index })),
        ...packingList.acessorios.map((item, index) => ({ item, category: 'acessorios', index })),
        ...packingList.chapeus.map((item, index) => ({ item, category: 'chapeus', index })),
      ]
    : [];

  // Group by category for display
  const groupedItems = allItems.reduce((acc, { item, category, index }) => {
    if (!acc[category]) acc[category] = [];
    acc[category].push({ item, index });
    return acc;
  }, {} as Record<string, { item: PackingItem; index: number }[]>);

  const wardrobeMap = new Map(wardrobeItems.map(item => [item.id, item]));

  const tripDays = Math.ceil(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const handleDeleteItem = (category: string, index: number) => {
    if (!packingList) return;
    
    const newList = {
      ...packingList,
      [category]: packingList[category as keyof PackingList].filter((_, i) => i !== index),
    };
    setLocalPackingList(newList);
    setHasChanges(true);
  };

  const handleAddItem = (item: PackingItem) => {
    const currentList = localPackingList || {
      roupas: [],
      calcados: [],
      acessorios: [],
      chapeus: [],
    };
    
    // Add to roupas by default (most common)
    const newList = {
      ...currentList,
      roupas: [...currentList.roupas, item],
    };
    setLocalPackingList(newList);
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    if (localPackingList) {
      onUpdateTrip(trip.id, { packing_list: localPackingList });
      setHasChanges(false);
    }
  };

  const handleDelete = () => {
    onDeleteTrip(trip.id);
    onOpenChange(false);
    setShowDeleteConfirm(false);
  };

  const totalItems = allItems.length;
  const inWardrobeCount = allItems.filter(({ item }) => item.in_wardrobe).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left font-display">{trip.destination}</SheetTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(trip.start_date), "d MMM", { locale: ptBR })} - {format(new Date(trip.end_date), "d MMM yyyy", { locale: ptBR })}
                  <span className="text-primary">• {tripDays} dias</span>
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-200px)] py-4">
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => onExportPDF(trip)}
                disabled={isExporting}
                className="rounded-xl"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => onAddToCalendar(trip)}
                className="rounded-xl"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendário
              </Button>
            </div>

            {/* Summary */}
            {totalItems > 0 && (
              <div className="flex items-center justify-center gap-3 text-sm py-2 bg-muted/30 rounded-xl">
                <span className="text-emerald-600 font-medium">{inWardrobeCount} no closet</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-amber-600 font-medium">{totalItems - inWardrobeCount} sugestões</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium">{totalItems} total</span>
              </div>
            )}

            {/* Simple Packing List */}
            <Card className="p-4 border-0 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Lista da Mala</h3>
                {hasChanges && (
                  <Button size="sm" onClick={handleSaveChanges} className="rounded-xl">
                    <Save className="w-4 h-4 mr-1" />
                    Salvar
                  </Button>
                )}
              </div>

              {totalItems === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm mb-2">Nenhum item na lista</p>
                  <p className="text-xs">Adicione itens abaixo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {Object.entries(groupedItems).map(([category, items]) => (
                      <div key={category} className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                          {categoryLabels[category] || category} ({items.length})
                        </h4>
                        {items.map(({ item, index }) => {
                          const wardrobeItem = item.id ? wardrobeMap.get(item.id) : undefined;
                          return (
                            <SimplePackingItem
                              key={item.id || `${category}-${index}`}
                              item={item}
                              onDelete={() => handleDeleteItem(category, index)}
                              wardrobeImage={wardrobeItem?.image_url || item.image_url}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Add Item */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <AddItemInline
                  onAdd={handleAddItem}
                  wardrobeItems={wardrobeItems}
                />
              </div>
            </Card>

            {/* Delete Trip */}
            {showDeleteConfirm ? (
              <Card className="p-4 border-destructive/30 bg-destructive/5">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <p className="font-medium text-destructive">Excluir esta viagem?</p>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </Card>
            ) : (
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Viagem
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
