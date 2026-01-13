import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Users, Info, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chromaticSeasons, type SeasonData } from '@/data/chromatic-seasons';
import { SeasonDetailModal } from './SeasonDetailModal';
import { useTemporarySeason } from '@/contexts/TemporarySeasonContext';

interface SeasonExplorerProps {
  onSelectSeason?: (season: SeasonData) => void;
  userSeasonId?: string | null;
  onTryPalette?: () => void;
}

type FilterType = 'all' | 'primavera' | 'verão' | 'outono' | 'inverno' | 'warm' | 'cool' | 'light' | 'deep';

const mainSeasonFilters = [
  { value: 'all', label: 'Todas' },
  { value: 'primavera', label: '🌸 Primavera' },
  { value: 'verão', label: '🌷 Verão' },
  { value: 'outono', label: '🍂 Outono' },
  { value: 'inverno', label: '❄️ Inverno' },
];

const characteristicFilters = [
  { value: 'warm', label: 'Quentes' },
  { value: 'cool', label: 'Frias' },
  { value: 'light', label: 'Claras' },
  { value: 'deep', label: 'Profundas' },
];

export function SeasonExplorer({ onSelectSeason, userSeasonId, onTryPalette }: SeasonExplorerProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<SeasonData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { temporarySeason } = useTemporarySeason();

  const filteredSeasons = chromaticSeasons.filter(season => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        season.name.toLowerCase().includes(query) ||
        season.subtype.toLowerCase().includes(query) ||
        season.keywords.some(k => k.toLowerCase().includes(query)) ||
        season.celebrities.some(c => c.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (activeFilter === 'all') return true;
    if (['primavera', 'verão', 'outono', 'inverno'].includes(activeFilter)) {
      return season.mainSeason === activeFilter;
    }
    if (activeFilter === 'warm') {
      return season.characteristics.temperature === 'warm' || season.characteristics.temperature === 'neutral-warm';
    }
    if (activeFilter === 'cool') {
      return season.characteristics.temperature === 'cool' || season.characteristics.temperature === 'neutral-cool';
    }
    if (activeFilter === 'light') {
      return season.characteristics.depth === 'light';
    }
    if (activeFilter === 'deep') {
      return season.characteristics.depth === 'deep';
    }
    return true;
  });

  const handleSeasonClick = (season: SeasonData) => {
    setSelectedSeason(season);
    setShowModal(true);
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, celebridade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Main season filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {mainSeasonFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(filter.value as FilterType)}
            className="rounded-full whitespace-nowrap flex-shrink-0"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Characteristic filters */}
      <div className="flex gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground self-center" />
        {characteristicFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter(prev => prev === filter.value ? 'all' : filter.value as FilterType)}
            className="rounded-full text-xs h-7"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredSeasons.length} {filteredSeasons.length === 1 ? 'paleta encontrada' : 'paletas encontradas'}
      </p>

      {/* Season cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredSeasons.map((season, index) => (
            <motion.div
              key={season.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
            >
              <SeasonCard
                season={season}
                isUserSeason={season.id === userSeasonId}
                isExperimenting={season.id === temporarySeason?.id}
                onClick={() => handleSeasonClick(season)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredSeasons.length === 0 && (
        <div className="text-center py-12">
          <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma paleta encontrada</p>
          <Button
            variant="ghost"
            onClick={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}
            className="mt-2"
          >
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <SeasonDetailModal
        season={selectedSeason}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={onSelectSeason}
        isUserSeason={selectedSeason?.id === userSeasonId}
        onTryPalette={onTryPalette}
      />
    </div>
  );
}

interface SeasonCardProps {
  season: SeasonData;
  isUserSeason: boolean;
  isExperimenting?: boolean;
  onClick: () => void;
}

function SeasonCard({ season, isUserSeason, isExperimenting = false, onClick }: SeasonCardProps) {
  // Determine card styling based on state
  const getCardClasses = () => {
    if (isUserSeason) {
      return 'border-primary bg-primary/5 shadow-glow';
    }
    if (isExperimenting) {
      return 'border-amber-500 border-dashed bg-amber-500/5 ring-2 ring-amber-500/20';
    }
    return 'border-border bg-card hover:border-primary/30 hover:shadow-soft';
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${getCardClasses()}`}
    >
      {/* Header with colors */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex -space-x-2">
          {season.colors.primary.slice(0, 4).map((color, i) => (
            <div
              key={color.hex}
              className="w-8 h-8 rounded-full border-2 border-card shadow-sm"
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
        <span className="text-2xl">{season.seasonIcon}</span>
      </div>

      {/* Name and subtype */}
      <h3 className="font-display text-lg font-semibold text-foreground">
        {season.name} {season.subtype}
      </h3>
      
      {/* Badge for user season or experimenting */}
      {isUserSeason && (
        <span className="inline-block mt-1 text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10">
          Sua paleta
        </span>
      )}
      {isExperimenting && !isUserSeason && (
        <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium px-2 py-0.5 rounded-full bg-amber-500/10">
          <Wand2 className="w-3 h-3" />
          <span className="animate-pulse">Experimentando</span>
        </span>
      )}

      {/* Short description */}
      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
        {season.shortDescription}
      </p>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1 mt-3">
        {season.keywords.slice(0, 3).map((keyword) => (
          <span
            key={keyword}
            className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
          >
            {keyword}
          </span>
        ))}
      </div>

      {/* Celebrities preview */}
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <Users className="w-3 h-3" />
        <span className="line-clamp-1">
          {season.celebrities.slice(0, 2).join(', ')}
        </span>
      </div>
    </motion.button>
  );
}
