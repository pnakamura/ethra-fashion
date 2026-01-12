import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Camera, Upload, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useColorAnalysis, type ColorAnalysisResult } from '@/hooks/useColorAnalysis';
import { useAuth } from '@/hooks/useAuth';

export function ChromaticDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAnalyzing, analyzeImage } = useColorAnalysis();
  const [demoResult, setDemoResult] = useState<ColorAnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      const result = await analyzeImage(imageData);
      if (result) {
        setDemoResult(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCTAClick = () => {
    if (user) {
      navigate('/chromatic');
    } else {
      navigate('/auth');
    }
  };

  // Show demo result
  if (demoResult) {
    return (
      <motion.div
        className="bg-card rounded-3xl p-8 shadow-elevated max-w-md mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center mb-6">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          
          <h3 className="font-display text-2xl font-semibold">
            Você é <span className="text-gradient">{demoResult.season_name} {demoResult.subtype}</span>!
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {demoResult.confidence}% de confiança
          </p>
        </div>

        {/* Preview image */}
        {capturedImage && (
          <div className="w-20 h-20 mx-auto mb-4 rounded-xl overflow-hidden shadow-soft">
            <img src={capturedImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Partial colors - demo */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Cores que te valorizam:</p>
          <div className="grid grid-cols-6 gap-2">
            {demoResult.recommended_colors.slice(0, 3).map((color, i) => (
              <motion.div
                key={i}
                className="aspect-square rounded-lg shadow-soft"
                style={{ backgroundColor: color.hex }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              />
            ))}
            {/* Locked colors */}
            {[1, 2, 3].map((_, i) => (
              <motion.div
                key={`locked-${i}`}
                className="aspect-square rounded-lg bg-muted flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.5, scale: 1 }}
                transition={{ delay: 0.3 + (i + 3) * 0.1 }}
              >
                <Lock className="w-3 h-3 text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={handleCTAClick}
          className="w-full gradient-primary text-primary-foreground shadow-glow"
        >
          {user ? 'Ver paleta completa' : 'Criar conta e desbloquear'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Desbloqueie todas as cores, dicas de combinação e integração com seu closet
        </p>
      </motion.div>
    );
  }

  // Show analyzing state
  if (isAnalyzing) {
    return (
      <motion.div
        className="bg-card rounded-3xl p-8 shadow-elevated max-w-md mx-auto text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>

        {capturedImage && (
          <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden shadow-soft">
            <img src={capturedImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <motion.p
          className="font-display text-lg"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Analisando seu tom de pele...
        </motion.p>
      </motion.div>
    );
  }

  // Initial demo state
  return (
    <motion.div
      className="bg-card rounded-3xl p-8 shadow-elevated max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="text-center mb-6">
        <motion.div
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="w-10 h-10 text-primary" />
        </motion.div>
        
        <h3 className="font-display text-2xl font-semibold mb-2">
          Descubra suas cores em 10 segundos
        </h3>
        <p className="text-muted-foreground text-sm">
          Análise cromática gratuita com inteligência artificial
        </p>
      </div>

      <label className="block">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="font-medium mb-1">Envie uma selfie</p>
            <p className="text-sm text-muted-foreground">
              Com luz natural, sem maquiagem pesada
            </p>
          </div>
        </div>
      </label>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Sua foto é processada com segurança e não é armazenada
      </p>
    </motion.div>
  );
}