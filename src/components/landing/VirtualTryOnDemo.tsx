import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, ArrowRight, Lock, User, Shirt, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DemoGarment {
  id: string;
  name: string;
  imageUrl: string;
  category: 'upper_body' | 'lower_body' | 'dress';
}

const DEMO_GARMENTS: DemoGarment[] = [
  { 
    id: 'blazer', 
    name: 'Blazer Clássico', 
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=600&fit=crop', 
    category: 'upper_body' 
  },
  { 
    id: 'dress', 
    name: 'Vestido Elegante', 
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop', 
    category: 'dress' 
  },
  { 
    id: 'shirt', 
    name: 'Camisa Casual', 
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=600&fit=crop', 
    category: 'upper_body' 
  },
];

const DEMO_STORAGE_KEY = 'vto-demo-timestamp';
const DEMO_COOLDOWN_HOURS = 24;

export function VirtualTryOnDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'select' | 'processing' | 'result'>('select');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<DemoGarment | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [hasUsedDemo, setHasUsedDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lastDemo = localStorage.getItem(DEMO_STORAGE_KEY);
    if (lastDemo) {
      const hoursSince = (Date.now() - parseInt(lastDemo)) / (1000 * 60 * 60);
      setHasUsedDemo(hoursSince < DEMO_COOLDOWN_HOURS);
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarImage(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleTryOn = async () => {
    if (!avatarImage || !selectedGarment || hasUsedDemo) return;

    setStep('processing');
    setError(null);

    try {
      console.log('Starting demo try-on with:', { 
        hasAvatar: !!avatarImage, 
        garment: selectedGarment.name 
      });
      
      const response = await supabase.functions.invoke('virtual-try-on', {
        body: {
          avatarImageUrl: avatarImage,
          garmentImageUrl: selectedGarment.imageUrl,
          category: selectedGarment.category,
          demoMode: true,
        },
      });

      console.log('Demo try-on response:', response);

      if (response.error) {
        console.error('Supabase function error:', response.error);
        throw new Error(response.error.message || 'Falha ao processar');
      }

      const data = response.data;
      console.log('Response data:', data);

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao processar');
      }

      if (!data.resultImageUrl) {
        throw new Error('Nenhuma imagem retornada pelo servidor');
      }

      console.log('Setting result image:', data.resultImageUrl.substring(0, 100) + '...');
      setResultImage(data.resultImageUrl);
      setStep('result');
      localStorage.setItem(DEMO_STORAGE_KEY, Date.now().toString());
    } catch (err) {
      console.error('Demo try-on error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar. Tente novamente.');
      setStep('select');
    }
  };

  const handleCTAClick = () => {
    if (user) {
      navigate('/provador');
    } else {
      navigate('/auth?mode=signup');
    }
  };

  const resetDemo = () => {
    setAvatarImage(null);
    setSelectedGarment(null);
    setResultImage(null);
    setStep('select');
    setError(null);
  };

  // Result state
  if (step === 'result' && resultImage) {
    return (
      <motion.div
        className="bg-card rounded-3xl p-6 md:p-8 shadow-elevated max-w-lg mx-auto"
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
            Sua <span className="text-gradient">transformação</span>!
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Veja como a peça fica em você
          </p>
        </div>

        {/* Result image with partial lock */}
        <div className="relative mb-6 rounded-2xl overflow-hidden">
          <img 
            src={resultImage} 
            alt="Virtual try-on result" 
            className="w-full aspect-[3/4] object-cover"
          />
          
          {/* Partial blur/lock overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-background/95 via-background/80 to-transparent flex items-end justify-center pb-6">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Crie sua conta para ver completo
              </p>
            </div>
          </div>
        </div>

        {/* Before/After preview */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-soft mx-auto mb-1">
              <img src={avatarImage!} alt="Antes" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-muted-foreground">Antes</span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
          <div className="text-center">
            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-soft mx-auto mb-1">
              <img src={resultImage} alt="Depois" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-muted-foreground">Depois</span>
          </div>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={handleCTAClick}
          className="w-full gradient-primary text-primary-foreground shadow-glow"
        >
          {user ? 'Acessar Provador Virtual' : 'Criar conta grátis'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Desbloqueie provas ilimitadas, seu closet virtual e recomendações de IA
        </p>

        <button 
          onClick={resetDemo}
          className="text-xs text-primary underline block mx-auto mt-3"
        >
          Tentar com outra foto
        </button>
      </motion.div>
    );
  }

  // Processing state
  if (step === 'processing') {
    return (
      <motion.div
        className="bg-card rounded-3xl p-8 shadow-elevated max-w-lg mx-auto text-center"
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

        {/* Preview images during processing */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {avatarImage && (
            <div className="w-20 h-24 rounded-xl overflow-hidden shadow-soft">
              <img src={avatarImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <ArrowRight className="w-6 h-6 text-primary" />
          </motion.div>
          {selectedGarment && (
            <div className="w-20 h-24 rounded-xl overflow-hidden shadow-soft">
              <img src={selectedGarment.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <motion.p
          className="font-display text-lg"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Criando sua transformação...
        </motion.p>
        <p className="text-sm text-muted-foreground mt-2">
          Isso pode levar alguns segundos
        </p>
      </motion.div>
    );
  }

  // Initial select state
  return (
    <motion.div
      className="bg-card rounded-3xl p-6 md:p-8 shadow-elevated max-w-lg mx-auto"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {hasUsedDemo ? (
        // Demo already used
        <div className="text-center py-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Check className="w-8 h-8 text-primary" />
          </motion.div>
          
          <h3 className="font-display text-xl font-semibold mb-2">
            Você já experimentou a demo!
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            Crie sua conta para provas ilimitadas
          </p>

          <Button
            size="lg"
            onClick={handleCTAClick}
            className="gradient-primary text-primary-foreground shadow-glow"
          >
            {user ? 'Acessar Provador Virtual' : 'Criar conta grátis'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <User className="w-8 h-8 text-primary" />
            </motion.div>
            
            <h3 className="font-display text-xl font-semibold mb-2">
              Experimente uma prova virtual grátis
            </h3>
            <p className="text-muted-foreground text-sm">
              Envie sua foto e escolha uma peça para experimentar
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          {/* Step 1: Upload avatar */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
              Sua foto (corpo inteiro)
            </label>
            
            {avatarImage ? (
              <div className="relative">
                <div className="w-full aspect-[3/4] max-h-48 rounded-xl overflow-hidden shadow-soft">
                  <img src={avatarImage} alt="Sua foto" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => setAvatarImage(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 hover:bg-primary/5 transition-all group">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="font-medium text-sm mb-1">Toque para enviar</p>
                    <p className="text-xs text-muted-foreground">
                      Foto de corpo inteiro, boa iluminação
                    </p>
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* Step 2: Select garment */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
              Escolha uma peça
            </label>
            
            <div className="grid grid-cols-3 gap-3">
              {DEMO_GARMENTS.map((garment) => (
                <button
                  key={garment.id}
                  onClick={() => setSelectedGarment(garment)}
                  className={`relative rounded-xl overflow-hidden aspect-[3/4] transition-all ${
                    selectedGarment?.id === garment.id
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'hover:opacity-90'
                  }`}
                >
                  <img 
                    src={garment.imageUrl} 
                    alt={garment.name} 
                    className="w-full h-full object-cover"
                  />
                  {selectedGarment?.id === garment.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">{garment.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Try-on button */}
          <Button
            size="lg"
            onClick={handleTryOn}
            disabled={!avatarImage || !selectedGarment}
            className="w-full gradient-primary text-primary-foreground shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shirt className="w-4 h-4 mr-2" />
            Experimentar agora
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Sua foto é processada com segurança e não é armazenada
          </p>
        </>
      )}
    </motion.div>
  );
}
