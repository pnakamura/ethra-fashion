import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, RotateCcw, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorAnalysisResult } from './ColorAnalysisResult';
import { useColorAnalysis, type ColorAnalysisResult as AnalysisType } from '@/hooks/useColorAnalysis';

interface ColorAnalysisProps {
  onComplete?: (result: AnalysisType) => void;
  onSave?: (result: AnalysisType) => void;
  showSaveButton?: boolean;
  demoMode?: boolean;
}

export function ColorAnalysis({ 
  onComplete, 
  onSave, 
  showSaveButton = true,
  demoMode = false 
}: ColorAnalysisProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAnalyzing, result, analyzeImage, reset } = useColorAnalysis();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
      handleAnalyze(imageData);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      handleAnalyze(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (imageBase64: string) => {
    const analysisResult = await analyzeImage(imageBase64);
    if (analysisResult && onComplete) {
      onComplete(analysisResult);
    }
  };

  const handleRetry = () => {
    setCapturedImage(null);
    reset();
  };

  const handleSave = () => {
    if (result && onSave) {
      onSave(result);
    }
  };

  // Show result
  if (result) {
    return (
      <ColorAnalysisResult 
        result={result}
        capturedImage={capturedImage}
        onRetry={handleRetry}
        onSave={showSaveButton ? handleSave : undefined}
        demoMode={demoMode}
      />
    );
  }

  // Show analyzing state
  if (isAnalyzing) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </motion.div>
        
        {capturedImage && (
          <div className="w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden shadow-soft">
            <img src={capturedImage} alt="Sua foto" className="w-full h-full object-cover" />
          </div>
        )}
        
        <motion.p
          className="text-lg font-display text-foreground"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Analisando seu tom de pele e olhos...
        </motion.p>
        <p className="text-sm text-muted-foreground mt-2">
          Isso leva alguns segundos
        </p>
      </motion.div>
    );
  }

  // Show camera
  if (showCamera) {
    return (
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-sm mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Overlay guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-56 border-2 border-white/50 rounded-full" />
          </div>
          
          {/* Close button */}
          <button
            onClick={stopCamera}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex justify-center mt-4">
          <Button
            size="lg"
            onClick={capturePhoto}
            className="gradient-primary text-primary-foreground shadow-glow px-8"
          >
            <Camera className="w-5 h-5 mr-2" />
            Capturar
          </Button>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-3">
          Posicione seu rosto dentro do círculo, com luz natural
        </p>
      </motion.div>
    );
  }

  // Show initial state - choose camera or upload
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Sparkles className="w-10 h-10 text-primary" />
      </motion.div>

      <h3 className="font-display text-2xl font-semibold mb-2">
        Análise Cromática com IA
      </h3>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
        Tire uma selfie com luz natural, sem maquiagem pesada, para uma análise mais precisa
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
        <Button
          size="lg"
          onClick={startCamera}
          className="flex-1 gradient-primary text-primary-foreground shadow-glow"
        >
          <Camera className="w-5 h-5 mr-2" />
          Tirar selfie
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="w-5 h-5 mr-2" />
          Enviar foto
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground mt-6">
        Sua foto é processada com segurança e não é armazenada
      </p>
    </motion.div>
  );
}