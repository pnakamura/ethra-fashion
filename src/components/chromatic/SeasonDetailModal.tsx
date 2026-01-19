import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Sparkles, Users, Gem, Shirt, Palette, Heart, Scissors, Star, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { toast } from 'sonner';
import type { SeasonData } from '@/data/chromatic-seasons';
import { useTemporarySeason } from '@/contexts/TemporarySeasonContext';
import { MakeupSwatchGrid } from '@/components/makeup/MakeupSwatchGrid';
import { getMakeupForSeason } from '@/data/makeup-palettes';

interface SeasonDetailModalProps {
  season: SeasonData | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (season: SeasonData) => void;
  isUserSeason?: boolean;
  onTryPalette?: () => void;
}

export function SeasonDetailModal({ 
  season, 
  isOpen, 
  onClose, 
  onSelect,
  isUserSeason,
  onTryPalette 
}: SeasonDetailModalProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const { setTemporarySeason } = useTemporarySeason();

  if (!season) return null;

  const handleTryPalette = () => {
    setTemporarySeason(season);
    toast.success(`Experimentando ${season.name} ${season.subtype}`, {
      description: 'Veja o preview na aba "Minha Paleta"',
      icon: <Wand2 className="w-4 h-4 text-amber-500" />,
      duration: 4000,
    });
    onClose();
    onTryPalette?.();
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    toast.success(`Cor ${hex} copiada!`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const CharacteristicBadge = ({ label, value }: { label: string; value: string }) => (
    <div className="px-3 py-2 rounded-xl bg-secondary/50 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full shadow-soft"
                style={{
                  background: `conic-gradient(from 0deg, ${season.colors.primary.slice(0, 4).map(c => c.hex).join(', ')})`,
                }}
              />
              <div>
                <DialogTitle className="font-display text-xl">
                  {season.name} {season.subtype}
                </DialogTitle>
                <span className="text-2xl">{season.seasonIcon}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-4 space-y-6">
            {/* User season badge */}
            {isUserSeason && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20"
              >
                <Star className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Esta é a sua paleta!</span>
              </motion.div>
            )}

            {/* Characteristics */}
            <div className="grid grid-cols-4 gap-2">
              <CharacteristicBadge 
                label="Temperatura" 
                value={season.characteristics.temperature.replace('-', ' ')} 
              />
              <CharacteristicBadge 
                label="Profundidade" 
                value={season.characteristics.depth} 
              />
              <CharacteristicBadge 
                label="Croma" 
                value={season.characteristics.chroma} 
              />
              <CharacteristicBadge 
                label="Contraste" 
                value={season.characteristics.contrast} 
              />
            </div>

            {/* Description */}
            <div>
              <h4 className="font-display text-lg font-medium mb-2">Sobre esta paleta</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {season.description}
              </p>
            </div>

            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-10 rounded-xl bg-muted p-1">
                <TabsTrigger value="colors" className="rounded-lg text-xs">
                  <Palette className="w-3 h-3 mr-1" />
                  Cores
                </TabsTrigger>
                <TabsTrigger value="style" className="rounded-lg text-xs">
                  <Shirt className="w-3 h-3 mr-1" />
                  Estilo
                </TabsTrigger>
                <TabsTrigger value="beauty" className="rounded-lg text-xs">
                  <Heart className="w-3 h-3 mr-1" />
                  Beauty
                </TabsTrigger>
                <TabsTrigger value="celebs" className="rounded-lg text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Famosas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="mt-4 space-y-4">
                {/* Primary colors */}
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Cores que valorizam
                  </h5>
                  <div className="grid grid-cols-6 gap-2">
                    {season.colors.primary.map((color) => (
                      <ColorSwatch 
                        key={color.hex} 
                        color={color} 
                        onCopy={handleCopyColor}
                        copied={copiedColor === color.hex}
                      />
                    ))}
                  </div>
                </div>

                {/* Neutrals */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Neutros ideais</h5>
                  <div className="grid grid-cols-4 gap-2">
                    {season.colors.neutrals.map((color) => (
                      <ColorSwatch 
                        key={color.hex} 
                        color={color} 
                        onCopy={handleCopyColor}
                        copied={copiedColor === color.hex}
                      />
                    ))}
                  </div>
                </div>

                {/* Accents */}
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    Cores de destaque
                  </h5>
                  <div className="grid grid-cols-4 gap-2">
                    {season.colors.accents.map((color) => (
                      <ColorSwatch 
                        key={color.hex} 
                        color={color} 
                        onCopy={handleCopyColor}
                        copied={copiedColor === color.hex}
                      />
                    ))}
                  </div>
                </div>

                {/* Avoid */}
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <X className="w-4 h-4 text-destructive" />
                    Cores para evitar
                  </h5>
                  <div className="grid grid-cols-4 gap-2">
                    {season.colors.avoid.map((color) => (
                      <ColorSwatch 
                        key={color.hex} 
                        color={color} 
                        onCopy={handleCopyColor}
                        copied={copiedColor === color.hex}
                        isAvoid
                      />
                    ))}
                  </div>
                </div>

                {/* Combinations */}
                <div>
                  <h5 className="text-sm font-medium mb-3">Combinações harmônicas</h5>
                  <div className="space-y-3">
                    {season.bestCombinations.map((combo) => (
                      <div key={combo.name} className="p-3 rounded-xl bg-secondary/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{combo.name}</span>
                          <div className="flex -space-x-1">
                            {combo.colors.map((hex) => (
                              <div
                                key={hex}
                                className="w-6 h-6 rounded-full border-2 border-card"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{combo.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="style" className="mt-4 space-y-4">
                {/* Metals */}
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Gem className="w-4 h-4" />
                    Metais ideais
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {season.metals.map((metal) => (
                      <span key={metal} className="px-3 py-1.5 rounded-full bg-secondary text-sm capitalize">
                        {metal === 'gold' ? '🥇 Ouro' : 
                         metal === 'silver' ? '🥈 Prata' : 
                         metal === 'rose-gold' ? '💗 Rose Gold' : 
                         metal === 'copper' ? '🧡 Cobre' : '🥉 Bronze'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Jewelry */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Joias & Pedras</h5>
                  <div className="flex flex-wrap gap-2">
                    {season.jewelry.map((item) => (
                      <span key={item} className="px-3 py-1.5 rounded-full bg-secondary/50 text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Fabrics */}
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    Tecidos ideais
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {season.fabrics.map((fabric) => (
                      <span key={fabric} className="px-3 py-1.5 rounded-full bg-secondary/50 text-xs">
                        {fabric}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Patterns */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Estampas</h5>
                  <div className="flex flex-wrap gap-2">
                    {season.patterns.map((pattern) => (
                      <span key={pattern} className="px-3 py-1.5 rounded-full bg-secondary/50 text-xs">
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Styling tips */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Dicas de estilo</h5>
                  <ul className="space-y-2">
                    {season.stylingTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="beauty" className="mt-4 space-y-4">
                {(() => {
                  const makeup = getMakeupForSeason(season.id);
                  if (!makeup) return (
                    <p className="text-sm text-muted-foreground">Dados de maquiagem não disponíveis.</p>
                  );
                  return (
                    <>
                      {/* Lips */}
                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-rose-500" />
                          Lábios
                        </h5>
                        <MakeupSwatchGrid products={makeup.recommended.lips} columns={6} />
                      </div>

                      {/* Eyes */}
                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          Olhos
                        </h5>
                        <MakeupSwatchGrid products={makeup.recommended.eyeshadow} columns={6} />
                      </div>

                      {/* Blush & Face */}
                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-pink-500" />
                          Face
                        </h5>
                        <MakeupSwatchGrid products={[...makeup.recommended.blush, ...makeup.recommended.highlighter]} columns={6} />
                      </div>

                      {/* Nails */}
                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Gem className="w-4 h-4 text-amber-500" />
                          Unhas
                        </h5>
                        <MakeupSwatchGrid products={makeup.recommended.nails} columns={5} />
                      </div>

                      {/* Avoid */}
                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <X className="w-4 h-4 text-destructive" />
                          Evitar em lábios
                        </h5>
                        <MakeupSwatchGrid products={makeup.avoid.lips} isAvoid columns={4} />
                      </div>
                    </>
                  );
                })()}
              </TabsContent>

              <TabsContent value="celebs" className="mt-4">
                <div>
                  <h5 className="text-sm font-medium mb-3">Celebridades com esta paleta</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {season.celebrities.map((celeb) => (
                      <div 
                        key={celeb} 
                        className="p-3 rounded-xl bg-secondary/50 flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{celeb}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action buttons */}
            {!isUserSeason && (
              <div className="pt-4 border-t border-border space-y-2">
                {/* Try temporarily button */}
                <Button
                  onClick={handleTryPalette}
                  variant="outline"
                  className="w-full"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Experimentar esta paleta
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Veja como ficariam suas recomendações com esta paleta
                </p>

                {/* Permanent selection */}
                {onSelect && (
                  <Button
                    onClick={() => {
                      onSelect(season);
                      onClose();
                    }}
                    className="w-full gradient-primary"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Usar permanentemente
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface ColorSwatchProps {
  color: { hex: string; name: string; description?: string };
  onCopy: (hex: string) => void;
  copied: boolean;
  isAvoid?: boolean;
}

function ColorSwatch({ color, onCopy, copied, isAvoid }: ColorSwatchProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onCopy(color.hex)}
      className="group relative"
      title={`${color.name} - ${color.hex}`}
    >
      <div
        className={`w-full aspect-square rounded-xl shadow-soft transition-all ${
          isAvoid ? 'opacity-60' : ''
        }`}
        style={{ backgroundColor: color.hex }}
      >
        {copied && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl"
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
        {isAvoid && (
          <div className="absolute inset-0 flex items-center justify-center">
            <X className="w-4 h-4 text-white drop-shadow" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1 truncate text-center">
        {color.name}
      </p>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {color.hex}
        {color.description && <span className="block text-muted-foreground">{color.description}</span>}
      </div>
    </motion.button>
  );
}
