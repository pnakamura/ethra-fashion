import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Briefcase, Check, CloudSun, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WeatherPreview } from './WeatherPreview';
import { SuggestedLooks } from './SuggestedLooks';
import { TripBrief } from './TripBrief';
import { PackingChecklist, type PackingList, type PackingItem } from './PackingChecklist';
import { MissingItemsSuggestion } from './MissingItemsSuggestion';
import { useTripWeather, TripWeatherResult } from '@/hooks/useTripWeather';

interface TripPlannerProps {
  wardrobeItems: { id: string; image_url: string; category: string; name?: string }[];
  onCreateTrip: (trip: {
    destination: string;
    start_date: string;
    end_date: string;
    trip_type: string;
    packed_items: string[];
    packing_list?: PackingList;
  }) => void;
  userId?: string;
}

export function TripPlanner({ wardrobeItems, onCreateTrip, userId }: TripPlannerProps) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState('leisure');
  const [packedItems, setPackedItems] = useState<string[]>([]);
  const [step, setStep] = useState<'details' | 'analyzing' | 'packing'>('details');
  const [weatherData, setWeatherData] = useState<TripWeatherResult | null>(null);
  
  const { analyze, isLoading } = useTripWeather();

  const toggleItem = (id: string) => {
    setPackedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const addMultipleItems = (ids: string[]) => {
    setPackedItems((prev) => {
      const newItems = ids.filter((id) => !prev.includes(id));
      return [...prev, ...newItems];
    });
  };

  const handleAnalyze = async () => {
    if (!destination || !startDate || !endDate) return;
    
    setStep('analyzing');
    
    const result = await analyze({
      destination,
      startDate,
      endDate,
      tripType,
      userId,
    });
    
    if (result) {
      setWeatherData(result);
      // Auto-select items from wardrobe that are in the packing list (only valid UUIDs)
      if (packedItems.length === 0 && result.packing_list) {
        const allPackingItems = [
          ...result.packing_list.roupas,
          ...result.packing_list.calcados,
          ...result.packing_list.acessorios,
          ...result.packing_list.chapeus,
        ];
        
        // Only select items that are in wardrobe AND have a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validIds = allPackingItems
          .filter(item => item.in_wardrobe && item.id && uuidRegex.test(item.id))
          .map(item => item.id as string);
        
        setPackedItems(validIds);
      }
    }
    
    setStep('packing');
  };

  const handleCreate = () => {
    onCreateTrip({
      destination,
      start_date: startDate,
      end_date: endDate,
      trip_type: tripType,
      packed_items: packedItems,
      packing_list: weatherData?.packing_list,
    });
    setDestination('');
    setStartDate('');
    setEndDate('');
    setTripType('leisure');
    setPackedItems([]);
    setWeatherData(null);
    setStep('details');
  };

  const tripDays = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  // Analyzing step - loading state
  if (step === 'analyzing') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 space-y-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <CloudSun className="w-16 h-16 text-primary" />
        </motion.div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-display font-semibold">Consultando Aura...</h3>
          <p className="text-muted-foreground text-sm">
            Analisando clima e preparando looks para {destination}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Criando sugestões personalizadas ✨
        </div>
      </motion.div>
    );
  }

  // Packing step - with weather info
  if (step === 'packing') {
    const essentialItems = weatherData?.recommendations.essential_items || [];
    const packingList = weatherData?.packing_list;
    
    // Calculate missing items from packing list
    const missingItems: PackingItem[] = packingList 
      ? [
          ...packingList.roupas,
          ...packingList.calcados,
          ...packingList.acessorios,
          ...packingList.chapeus,
        ].filter(item => !item.in_wardrobe)
      : [];
    
    // Calculate in-wardrobe items count
    const inWardrobeItems = packingList 
      ? [
          ...packingList.roupas,
          ...packingList.calcados,
          ...packingList.acessorios,
          ...packingList.chapeus,
        ].filter(item => item.in_wardrobe).length
      : 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-5"
      >
        <div className="text-center">
          <h3 className="text-2xl font-display font-semibold mb-1">Monte sua Mala</h3>
          <p className="text-muted-foreground">
            {tripDays} dias em {destination}
          </p>
        </div>

        {/* Trip Brief - Editorial Section */}
        {weatherData && (
          <TripBrief
            tripBrief={weatherData.trip_brief}
            packingMood={weatherData.weather.packing_mood}
            climateVibe={weatherData.weather.climate_vibe}
          />
        )}

        {/* Weather Preview */}
        {weatherData && (
          <WeatherPreview 
            weather={weatherData.weather} 
            tips={weatherData.recommendations.tips}
          />
        )}

        {/* Packing Checklist - New Categorized UI */}
        {packingList && (
          <PackingChecklist
            packingList={packingList}
            wardrobeItems={wardrobeItems}
            selectedItems={packedItems}
            onToggleItem={toggleItem}
          />
        )}

        {/* Missing Items Suggestions */}
        {missingItems.length > 0 && (
          <MissingItemsSuggestion items={missingItems} />
        )}

        {/* Suggested Looks */}
        {weatherData && weatherData.recommendations.suggested_looks.length > 0 && (
          <SuggestedLooks
            looks={weatherData.recommendations.suggested_looks}
            wardrobeItems={wardrobeItems}
            onAddLook={addMultipleItems}
            selectedItems={packedItems}
          />
        )}

        {/* Fallback: Simple grid if no packing list */}
        {!packingList && wardrobeItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Todas as Peças</h4>
              <span className="text-xs text-muted-foreground">
                {packedItems.length} selecionadas
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <AnimatePresence>
                {wardrobeItems.map((item, index) => {
                  const isEssential = essentialItems.includes(item.id);
                  const isSelected = packedItems.includes(item.id);
                  
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => toggleItem(item.id)}
                      className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2'
                          : isEssential
                          ? 'ring-2 ring-amber-400/50'
                          : ''
                      }`}
                    >
                      <img
                        src={item.image_url}
                        alt={item.category}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Essential badge */}
                      {isEssential && !isSelected && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-[10px] font-medium text-amber-900">
                          Aura ✨
                        </div>
                      )}
                      
                      {/* Selected overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {wardrobeItems.length === 0 && (
          <Card className="p-8 text-center border-0 shadow-soft">
            <p className="text-muted-foreground">
              Adicione peças ao seu closet para montar sua mala
            </p>
          </Card>
        )}

        {/* Summary Stats */}
        {packingList && (
          <div className="flex items-center justify-center gap-4 py-2 text-sm">
            <span className="text-emerald-600 font-medium">
              {inWardrobeItems} peças do closet
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-amber-600 font-medium">
              {missingItems.length} sugestões
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-primary font-medium">
              {packedItems.length} selecionadas
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setStep('details');
              setWeatherData(null);
            }}
            className="flex-1 rounded-xl"
          >
            Voltar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={packedItems.length === 0}
            className="flex-1 rounded-xl gradient-primary text-primary-foreground"
          >
            Criar Viagem
          </Button>
        </div>
      </motion.div>
    );
  }

  // Details step
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-2xl font-display font-semibold mb-1">Nova Viagem</h3>
        <p className="text-muted-foreground">
          Deixe a Aura planejar sua mala ✨
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground">Destino</Label>
          <div className="relative mt-1.5">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ex: Paris, França"
              className="pl-11 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm text-muted-foreground">Ida</Label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Volta</Label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Tipo de Viagem</Label>
          <Select value={tripType} onValueChange={setTripType}>
            <SelectTrigger className="mt-1.5 rounded-xl">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leisure">Lazer</SelectItem>
              <SelectItem value="business">Negócios</SelectItem>
              <SelectItem value="adventure">Aventura</SelectItem>
              <SelectItem value="romantic">Romântica</SelectItem>
              <SelectItem value="beach">Praia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!destination || !startDate || !endDate || isLoading}
        className="w-full h-12 rounded-xl gradient-primary text-primary-foreground"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Consultando Aura...
          </>
        ) : (
          <>
            <CloudSun className="w-4 h-4 mr-2" />
            Analisar Clima & Continuar
          </>
        )}
      </Button>
    </motion.div>
  );
}
