import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Calendar, Plane, Download, Plus, Trash2, 
  Check, ShoppingBag, Shirt, Footprints, Watch, Crown,
  Loader2, X, Edit3, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
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
  onExportPDF: (trip: Trip) => void;
  onAddToCalendar: (trip: Trip) => void;
  isExporting?: boolean;
}

const categoryConfig = {
  roupas: { icon: Shirt, label: 'Roupas', color: 'text-primary' },
  calcados: { icon: Footprints, label: 'Calçados', color: 'text-amber-500' },
  acessorios: { icon: Watch, label: 'Acessórios', color: 'text-emerald-500' },
  chapeus: { icon: Crown, label: 'Chapéus', color: 'text-violet-500' },
};

function EditablePackingItem({
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "relative p-3 rounded-xl border transition-all group",
        item.in_wardrobe 
          ? "bg-emerald-500/5 border-emerald-500/30" 
          : "bg-amber-500/5 border-amber-500/30"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Image/Icon */}
        <div className="flex-shrink-0">
          {item.in_wardrobe && wardrobeImage ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden">
              <img 
                src={wardrobeImage} 
                alt={item.name} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center border border-dashed border-muted-foreground/30">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-tight truncate">{item.name}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{item.category}</span>
            {item.quantity > 1 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                x{item.quantity}
              </Badge>
            )}
          </div>
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Status badge */}
      <div className="absolute top-2 right-10">
        {item.in_wardrobe ? (
          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] px-1.5 py-0">
            <Check className="w-2.5 h-2.5 mr-0.5" />
            Closet
          </Badge>
        ) : (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px] px-1.5 py-0">
            <ShoppingBag className="w-2.5 h-2.5 mr-0.5" />
            Sugestão
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

function AddItemForm({
  category,
  onAdd,
  wardrobeItems,
}: {
  category: keyof PackingList;
  onAdd: (item: PackingItem) => void;
  wardrobeItems: { id: string; image_url: string; category: string; name?: string }[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedWardrobeItem, setSelectedWardrobeItem] = useState<string>('');

  const handleAdd = () => {
    if (!name.trim() && !selectedWardrobeItem) return;

    const wardrobeItem = wardrobeItems.find(i => i.id === selectedWardrobeItem);
    
    const newItem: PackingItem = {
      id: selectedWardrobeItem || undefined,
      name: wardrobeItem?.name || name || 'Item personalizado',
      category: wardrobeItem?.category || categoryConfig[category].label,
      quantity: parseInt(quantity) || 1,
      colors: [],
      styles: [],
      fabrics: [],
      in_wardrobe: !!selectedWardrobeItem,
      image_url: wardrobeItem?.image_url,
      reason: 'Adicionado manualmente',
    };

    onAdd(newItem);
    setName('');
    setQuantity('1');
    setSelectedWardrobeItem('');
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-xl border-dashed"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Item
      </Button>
    );
  }

  return (
    <Card className="p-3 space-y-3 border-primary/30">
      <div className="space-y-2">
        <Select value={selectedWardrobeItem} onValueChange={setSelectedWardrobeItem}>
          <SelectTrigger className="rounded-xl text-sm">
            <SelectValue placeholder="Selecionar do closet (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhum (item novo)</SelectItem>
            {wardrobeItems.map(item => (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex items-center gap-2">
                  <img src={item.image_url} alt="" className="w-6 h-6 rounded object-cover" />
                  <span>{item.name || item.category}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!selectedWardrobeItem && (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do item"
            className="rounded-xl text-sm"
          />
        )}

        <div className="flex gap-2">
          <Select value={quantity} onValueChange={setQuantity}>
            <SelectTrigger className="w-24 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(n => (
                <SelectItem key={n} value={n.toString()}>x{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleAdd} size="sm" className="flex-1 rounded-xl">
            <Check className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function TripDetailSheet({
  trip,
  open,
  onOpenChange,
  wardrobeItems,
  onUpdateTrip,
  onExportPDF,
  onAddToCalendar,
  isExporting = false,
}: TripDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<keyof PackingList>('roupas');
  const [localPackingList, setLocalPackingList] = useState<PackingList | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state when trip changes
  useState(() => {
    if (trip?.packing_list) {
      setLocalPackingList(trip.packing_list);
    }
  });

  if (!trip) return null;

  const packingList = localPackingList || trip.packing_list || {
    roupas: [],
    calcados: [],
    acessorios: [],
    chapeus: [],
  };

  const wardrobeMap = new Map(wardrobeItems.map(item => [item.id, item]));

  const tripDays = Math.ceil(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const handleDeleteItem = (category: keyof PackingList, index: number) => {
    const newList = {
      ...packingList,
      [category]: packingList[category].filter((_, i) => i !== index),
    };
    setLocalPackingList(newList);
    setHasChanges(true);
  };

  const handleAddItem = (category: keyof PackingList, item: PackingItem) => {
    const newList = {
      ...packingList,
      [category]: [...packingList[category], item],
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

  const getCounts = (items: PackingItem[]) => ({
    total: items.length,
    inWardrobe: items.filter(i => i.in_wardrobe).length,
  });

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

        <ScrollArea className="h-[calc(90vh-180px)] py-4">
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
                Google Calendar
              </Button>
            </div>

            {/* Packing List Editor */}
            <Card className="p-4 space-y-4 border-0 shadow-soft">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" />
                  Editar Mala
                </h3>
                {hasChanges && (
                  <Button size="sm" onClick={handleSaveChanges} className="rounded-xl">
                    <Save className="w-4 h-4 mr-1" />
                    Salvar
                  </Button>
                )}
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as keyof PackingList)}>
                <TabsList className="w-full grid grid-cols-4 h-10">
                  {(Object.keys(categoryConfig) as (keyof PackingList)[]).map((cat) => {
                    const config = categoryConfig[cat];
                    const counts = getCounts(packingList[cat]);
                    const Icon = config.icon;
                    
                    return (
                      <TabsTrigger 
                        key={cat} 
                        value={cat}
                        className="flex items-center gap-1 text-xs data-[state=active]:bg-primary/10"
                      >
                        <Icon className={cn("w-3.5 h-3.5", config.color)} />
                        <span className="hidden sm:inline">{config.label}</span>
                        {counts.total > 0 && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-0.5">
                            {counts.total}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {(Object.keys(categoryConfig) as (keyof PackingList)[]).map((cat) => (
                  <TabsContent key={cat} value={cat} className="mt-3 space-y-2">
                    <AnimatePresence mode="popLayout">
                      {packingList[cat].length === 0 ? (
                        <div className="py-6 text-center text-muted-foreground text-sm">
                          Nenhum item nesta categoria
                        </div>
                      ) : (
                        packingList[cat].map((item, idx) => {
                          const wardrobeItem = item.id ? wardrobeMap.get(item.id) : undefined;
                          
                          return (
                            <EditablePackingItem
                              key={item.id || `${cat}-${idx}`}
                              item={item}
                              onDelete={() => handleDeleteItem(cat, idx)}
                              wardrobeImage={wardrobeItem?.image_url || item.image_url}
                            />
                          );
                        })
                      )}
                    </AnimatePresence>

                    <AddItemForm
                      category={cat}
                      onAdd={(item) => handleAddItem(cat, item)}
                      wardrobeItems={wardrobeItems}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
