import { motion } from 'framer-motion';
import { Wand2, X, Check, Sparkles, AlertTriangle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTemporarySeason } from '@/contexts/TemporarySeasonContext';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSeasonById, type SeasonData } from '@/data/chromatic-seasons';
import type { ColorAnalysisResult } from '@/hooks/useColorAnalysis';

interface TemporaryPalettePreviewProps {
  temporarySeason: SeasonData;
  savedAnalysis: ColorAnalysisResult | null;
}

export function TemporaryPalettePreview({ temporarySeason, savedAnalysis }: TemporaryPalettePreviewProps) {
  const { clearTemporary } = useTemporarySeason();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const savedSeason = savedAnalysis ? getSeasonById(savedAnalysis.season_id) : null;

  const handleMakePermanent = async () => {
    if (!user || !temporarySeason) return;

    try {
      // Build complete analysis object matching ColorAnalysisResult interface
      const completeAnalysis: ColorAnalysisResult = {
        season_id: temporarySeason.id,
        season_name: temporarySeason.name,
        subtype: temporarySeason.subtype,
        confidence: 100, // 100% because user chose manually
        explanation: `Você escolheu a paleta ${temporarySeason.name} ${temporarySeason.subtype}. ${temporarySeason.description}`,
        skin_tone: 'Escolha manual',
        eye_color: 'Escolha manual',
        hair_color: 'Escolha manual',
        recommended_colors: temporarySeason.colors.primary.map(c => ({
          hex: c.hex,
          name: c.name
        })),
        avoid_colors: temporarySeason.colors.avoid.map(c => ({
          hex: c.hex,
          name: c.name
        })),
        analyzed_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          color_season: temporarySeason.id,
          color_analysis: JSON.parse(JSON.stringify(completeAnalysis))
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`${temporarySeason.name} ${temporarySeason.subtype} agora é sua paleta!`);
      clearTemporary();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Force page reload to update saved analysis
      window.location.reload();
    } catch (error) {
      console.error('Error saving season:', error);
      toast.error('Erro ao salvar paleta');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 relative"
    >
      {/* Attention overlay that fades out */}
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent 
                   rounded-2xl pointer-events-none z-10"
      />
      
      {/* Header */}
      <motion.div 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex items-center justify-between p-4 rounded-xl 
                   bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent 
                   border-2 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="p-2 rounded-full bg-amber-500/20"
          >
            <Wand2 className="w-5 h-5 text-amber-600" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                {temporarySeason.name} {temporarySeason.subtype}
              </h3>
              <motion.span 
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-700 dark:text-amber-300 font-medium"
              >
                PREVIEW
              </motion.span>
            </div>
            <p className="text-sm text-muted-foreground">
              Veja como seria usar esta paleta
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearTemporary} className="hover:bg-amber-500/10">
          <X className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Primary Colors */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          <h4 className="font-medium">Cores que te valorizariam</h4>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {temporarySeason.colors.primary.map((color, i) => (
            <motion.div
              key={color.hex}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative"
            >
              <div
                className="aspect-square rounded-xl shadow-sm border border-border/50 cursor-pointer transition-transform hover:scale-105"
                style={{ backgroundColor: color.hex }}
                onClick={() => {
                  navigator.clipboard.writeText(color.hex);
                  toast.success(`${color.name} copiado!`);
                }}
              />
              <p className="text-xs text-center mt-1 text-muted-foreground truncate">
                {color.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Accent Colors */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h4 className="font-medium">Cores de acento</h4>
        </div>
        <div className="flex gap-2 flex-wrap">
          {temporarySeason.colors.accents.map((color, i) => (
            <motion.div
              key={color.hex}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50"
            >
              <div
                className="w-4 h-4 rounded-full border border-border/50"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-xs">{color.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Avoid Colors */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <h4 className="font-medium text-rose-600 dark:text-rose-400">Evitar com esta paleta</h4>
        </div>
        <div className="flex gap-2 flex-wrap">
          {temporarySeason.colors.avoid.slice(0, 4).map((color, i) => (
            <div
              key={color.hex}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10"
            >
              <div
                className="w-4 h-4 rounded-full border border-rose-300 relative"
                style={{ backgroundColor: color.hex }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <X className="w-3 h-3 text-white drop-shadow-sm" />
                </div>
              </div>
              <span className="text-xs text-rose-600 dark:text-rose-400">{color.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Celebrities */}
      {temporarySeason.celebrities.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Celebridades desta paleta</h4>
          <div className="flex flex-wrap gap-2">
            {temporarySeason.celebrities.map((celebrity) => (
              <span
                key={celebrity}
                className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
              >
                {celebrity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-side comparison */}
      {savedSeason && (
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="font-medium text-sm text-muted-foreground">Comparação</h4>
          <div className="grid grid-cols-2 gap-4">
            {/* Current saved */}
            <div className="p-3 rounded-xl bg-secondary/30 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Sua paleta atual</p>
              <p className="text-sm font-semibold">{savedSeason.name} {savedSeason.subtype}</p>
              <div className="flex -space-x-1">
                {savedSeason.colors.primary.slice(0, 5).map((color) => (
                  <div
                    key={color.hex}
                    className="w-5 h-5 rounded-full border-2 border-card"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
            
            {/* Temporary */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-amber-600" />
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Experimentando</p>
              </div>
              <p className="text-sm font-semibold">{temporarySeason.name} {temporarySeason.subtype}</p>
              <div className="flex -space-x-1">
                {temporarySeason.colors.primary.slice(0, 5).map((color) => (
                  <div
                    key={color.hex}
                    className="w-5 h-5 rounded-full border-2 border-card"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={clearTemporary}
        >
          <X className="w-4 h-4 mr-2" />
          Voltar para minha paleta
        </Button>
        <Button 
          className="flex-1 gradient-primary"
          onClick={handleMakePermanent}
        >
          <Check className="w-4 h-4 mr-2" />
          Usar esta paleta
        </Button>
      </div>
    </motion.div>
  );
}
