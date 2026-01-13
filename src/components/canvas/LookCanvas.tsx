import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CanvasItem {
  id: string;
  image_url: string;
  x: number;
  y: number;
  scale: number;
}

interface LookCanvasProps {
  availableItems: { id: string; image_url: string; category: string }[];
  onSave: (items: CanvasItem[], name: string) => void;
  preloadItems?: { id: string; image_url: string }[] | null;
}

export function LookCanvas({ availableItems, onSave, preloadItems }: LookCanvasProps) {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const preloadedRef = useRef<string | null>(null);

  // Preload items when opening a saved look
  useEffect(() => {
    if (preloadItems && preloadItems.length > 0) {
      const preloadKey = preloadItems.map(i => i.id).join(',');
      if (preloadedRef.current !== preloadKey) {
        preloadedRef.current = preloadKey;
        const newItems: CanvasItem[] = preloadItems.map((item, index) => ({
          id: `${item.id}:::${Date.now()}:::${index}`,
          image_url: item.image_url,
          x: 50 + (index % 2) * 120,
          y: 50 + Math.floor(index / 2) * 120,
          scale: 1,
        }));
        setCanvasItems(newItems);
      }
    }
  }, [preloadItems]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addToCanvas = (item: { id: string; image_url: string }) => {
    const newItem: CanvasItem = {
      id: `${item.id}:::${Date.now()}`,
      image_url: item.image_url,
      x: 50 + Math.random() * 100,
      y: 50 + Math.random() * 100,
      scale: 1,
    };
    setCanvasItems([...canvasItems, newItem]);
  };

  const removeFromCanvas = (id: string) => {
    setCanvasItems(canvasItems.filter((item) => item.id !== id));
  };

  const clearCanvas = () => {
    setCanvasItems([]);
  };

  const handleDrag = (id: string, x: number, y: number) => {
    setCanvasItems(
      canvasItems.map((item) =>
        item.id === id ? { ...item, x, y } : item
      )
    );
  };

  const handleSave = () => {
    if (canvasItems.length > 0) {
      onSave(canvasItems, `Look ${new Date().toLocaleDateString('pt-BR')}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Canvas area */}
      <Card className="relative aspect-[3/4] bg-gradient-to-b from-ivory to-champagne border-0 shadow-soft overflow-hidden">
        <div
          ref={canvasRef}
          className="absolute inset-0"
        >
          {canvasItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-display font-semibold text-foreground mb-1">
                Seu Canvas
              </p>
              <p className="text-sm text-muted-foreground">
                Arraste peças do seu closet para criar um look
              </p>
            </div>
          ) : (
            canvasItems.map((item) => (
              <motion.div
                key={item.id}
                drag
                dragMomentum={false}
                onDrag={(_, info) => {
                  handleDrag(item.id, info.point.x, info.point.y);
                }}
                onDragStart={() => setDraggedItem(item.id)}
                onDragEnd={() => setDraggedItem(null)}
                className={`absolute cursor-grab active:cursor-grabbing ${
                  draggedItem === item.id ? 'z-10' : 'z-0'
                }`}
                style={{
                  left: item.x,
                  top: item.y,
                  transform: `scale(${item.scale})`,
                }}
                whileDrag={{ scale: 1.1 }}
              >
                <div className="relative group">
                  <img
                    src={item.image_url}
                    alt="Item"
                    className="w-24 h-24 object-cover rounded-xl shadow-elevated"
                    draggable={false}
                  />
                  <button
                    onClick={() => removeFromCanvas(item.id)}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="flex-1 rounded-xl"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpar
        </Button>
        <Button
          onClick={handleSave}
          disabled={canvasItems.length === 0}
          className="flex-1 rounded-xl gradient-primary text-primary-foreground"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Look
        </Button>
      </div>

      {/* Items selector */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Peças do Closet
        </h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addToCanvas(item)}
              className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-soft hover:shadow-elevated transition-shadow"
            >
              <img
                src={item.image_url}
                alt={item.category}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {availableItems.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              Adicione peças ao seu closet primeiro
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
