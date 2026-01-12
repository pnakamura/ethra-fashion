import { motion } from 'framer-motion';
import { Check, RotateCcw, Sparkles, X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ColorAnalysisResult as AnalysisType } from '@/hooks/useColorAnalysis';

interface ColorAnalysisResultProps {
  result: AnalysisType;
  capturedImage?: string | null;
  onRetry?: () => void;
  onSave?: () => void;
  demoMode?: boolean;
}

export function ColorAnalysisResult({ 
  result, 
  capturedImage, 
  onRetry, 
  onSave,
  demoMode = false 
}: ColorAnalysisResultProps) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header with result */}
      <div className="text-center">
        <motion.div
          className="w-20 h-20 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <Sparkles className="w-10 h-10 text-primary-foreground" />
        </motion.div>
        
        <motion.h3
          className="font-display text-3xl font-semibold mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Você é <span className="text-gradient">{result.season_name} {result.subtype}</span>
        </motion.h3>
        
        <motion.div
          className="flex items-center justify-center gap-2 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-sm">{result.confidence}% de confiança</span>
        </motion.div>
      </div>

      {/* Photo comparison (if available) */}
      {capturedImage && (
        <motion.div
          className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-soft border-2 border-primary/20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <img src={capturedImage} alt="Sua foto" className="w-full h-full object-cover" />
        </motion.div>
      )}

      {/* Explanation */}
      <motion.div
        className="bg-card rounded-2xl p-4 shadow-soft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h4 className="font-display text-lg font-medium mb-2">Por que essa paleta?</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
        
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="bg-secondary/50 rounded-lg p-2">
            <p className="text-muted-foreground">Pele</p>
            <p className="font-medium truncate">{result.skin_tone}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2">
            <p className="text-muted-foreground">Olhos</p>
            <p className="font-medium truncate">{result.eye_color}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2">
            <p className="text-muted-foreground">Cabelo</p>
            <p className="font-medium truncate">{result.hair_color}</p>
          </div>
        </div>
      </motion.div>

      {/* Color palette - full or demo */}
      <motion.div
        className={`bg-card rounded-2xl p-4 shadow-soft ${demoMode ? 'relative overflow-hidden' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h4 className="font-display text-lg font-medium mb-3">Cores que te valorizam</h4>
        
        <div className="grid grid-cols-6 gap-2">
          {result.recommended_colors.slice(0, demoMode ? 3 : 6).map((color, index) => (
            <motion.div
              key={color.hex}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.05 }}
            >
              <div
                className="w-full aspect-square rounded-xl shadow-soft mb-1"
                style={{ backgroundColor: color.hex }}
              />
              <p className="text-xs text-muted-foreground truncate">{color.name}</p>
            </motion.div>
          ))}
          
          {/* Demo mode: show locked colors */}
          {demoMode && result.recommended_colors.slice(3, 6).map((color, index) => (
            <motion.div
              key={color.hex}
              className="text-center opacity-50"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.5, scale: 1 }}
              transition={{ delay: 0.8 + (index + 3) * 0.05 }}
            >
              <div
                className="w-full aspect-square rounded-xl shadow-soft mb-1 relative bg-muted"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">???</p>
            </motion.div>
          ))}
        </div>
        
        {demoMode && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        )}
      </motion.div>

      {/* Avoid colors - only in full mode */}
      {!demoMode && (
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-soft"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h4 className="font-display text-lg font-medium mb-3 flex items-center gap-2">
            <X className="w-4 h-4 text-destructive" />
            Cores para evitar
          </h4>
          
          <div className="grid grid-cols-3 gap-3">
            {result.avoid_colors.map((color, index) => (
              <motion.div
                key={color.hex}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.05 }}
              >
                <div
                  className="w-full aspect-square rounded-xl shadow-soft mb-1 opacity-60"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="text-xs text-muted-foreground">{color.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        {onRetry && (
          <Button
            variant="outline"
            size="lg"
            onClick={onRetry}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        )}
        
        {onSave && (
          <Button
            size="lg"
            onClick={onSave}
            className="flex-1 gradient-primary text-primary-foreground shadow-glow"
          >
            <Check className="w-4 h-4 mr-2" />
            Salvar paleta
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}