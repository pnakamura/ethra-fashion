import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Shirt, Star, AlertTriangle, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getSeasonById, type SeasonData } from '@/data/chromatic-seasons';
import type { ColorAnalysisResult } from '@/hooks/useColorAnalysis';

interface ChromaticHeroProps {
  analysis: ColorAnalysisResult | null;
  temporarySeason?: SeasonData | null;
  isUsingTemporary?: boolean;
  wardrobeStats?: {
    ideal: number;
    neutral: number;
    avoid: number;
    total: number;
  };
  onExploreClick?: () => void;
  onNewAnalysis?: () => void;
}

export function ChromaticHero({ 
  analysis, 
  temporarySeason,
  isUsingTemporary = false,
  wardrobeStats,
  onExploreClick,
  onNewAnalysis 
}: ChromaticHeroProps) {
  const navigate = useNavigate();
  const savedSeason = analysis ? getSeasonById(analysis.season_id) : null;
  
  // Use temporary season for display if experimenting
  const displaySeason = isUsingTemporary && temporarySeason ? temporarySeason : savedSeason;
  
  // Get gradient colors from display season or default
  const getGradientColors = () => {
    if (displaySeason) {
      const colors = displaySeason.colors.primary.slice(0, 4).map(c => c.hex);
      return colors;
    }
    return ['#E6E6FA', '#FFB6C1', '#87CEEB', '#98FB98'];
  };
  
  const gradientColors = getGradientColors();

  if (!analysis && !isUsingTemporary) {
    // Empty state - CTA to analyze
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-gold/5 to-secondary/30 p-6 border border-border/50"
      >
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center shadow-glow"
          >
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          
          <h2 className="font-display text-2xl font-semibold mb-2">
            Descubra sua paleta ideal
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Faça uma análise cromática com IA e receba recomendações personalizadas de cores
          </p>
          
          <Button 
            onClick={onNewAnalysis}
            className="gradient-primary shadow-glow"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Analisar minhas cores
          </Button>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gold/10 blur-3xl" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-card border shadow-soft ${
        isUsingTemporary 
          ? 'border-amber-500/50 ring-2 ring-amber-500/20' 
          : 'border-border/50'
      }`}
    >
      {/* Gradient background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `linear-gradient(135deg, ${gradientColors[0]}40, ${gradientColors[1]}30, ${gradientColors[2]}20, ${gradientColors[3]}10)`,
        }}
      />
      
      <div className="relative z-10 p-6">
        <div className="flex items-start gap-4">
          {/* Season palette circle */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="relative flex-shrink-0"
          >
            <div
              className={`w-20 h-20 rounded-full shadow-elevated ${
                isUsingTemporary ? 'ring-2 ring-amber-500/50' : ''
              }`}
              style={{
                background: `conic-gradient(from 0deg, ${gradientColors.join(', ')})`,
              }}
            />
            <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
              <span className="text-2xl">{displaySeason?.seasonIcon || '🎨'}</span>
            </div>
          </motion.div>
          
          {/* Season info */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-2xl font-semibold text-gradient">
                  {displaySeason?.name || analysis?.season_name}
                </h2>
                {isUsingTemporary && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span className="animate-pulse">Experimentando</span>
                  </motion.span>
                )}
              </div>
              <p className="text-lg text-foreground/80 font-display">
                {displaySeason?.subtype || analysis?.subtype}
              </p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {isUsingTemporary 
                  ? 'Preview visual - não é sua paleta salva' 
                  : (displaySeason?.shortDescription || analysis?.explanation)
                }
              </p>
            </motion.div>
          </div>
          
          {/* Explore button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onExploreClick}
            className="flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Quick stats - only show for saved analysis */}
        {!isUsingTemporary && wardrobeStats && wardrobeStats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5 grid grid-cols-3 gap-3"
          >
            <button
              onClick={() => navigate('/closet?filter=ideal')}
              className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
            >
              <Star className="w-4 h-4 text-emerald-600" />
              <div className="text-left">
                <p className="text-lg font-semibold text-emerald-600">{wardrobeStats.ideal}</p>
                <p className="text-xs text-muted-foreground">Ideais</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/closet?filter=neutral')}
              className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
            >
              <Shirt className="w-4 h-4 text-amber-600" />
              <div className="text-left">
                <p className="text-lg font-semibold text-amber-600">{wardrobeStats.neutral}</p>
                <p className="text-xs text-muted-foreground">Neutras</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/closet?filter=avoid')}
              className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <div className="text-left">
                <p className="text-lg font-semibold text-rose-600">{wardrobeStats.avoid}</p>
                <p className="text-xs text-muted-foreground">Evitar</p>
              </div>
            </button>
          </motion.div>
        )}
        
        {/* Color swatches preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 flex items-center gap-2"
        >
          <div className="flex -space-x-1">
            {displaySeason?.colors.primary.slice(0, 6).map((color, i) => (
              <motion.div
                key={color.hex}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="w-6 h-6 rounded-full border-2 border-card shadow-sm"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            )) || analysis?.recommended_colors.slice(0, 6).map((color, i) => (
              <motion.div
                key={color.hex}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="w-6 h-6 rounded-full border-2 border-card shadow-sm"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {displaySeason 
              ? `+${Math.max(0, displaySeason.colors.primary.length - 6)} cores`
              : `+${Math.max(0, (analysis?.recommended_colors.length || 0) - 6)} cores`
            }
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
