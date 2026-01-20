/**
 * Chromatic Camera Capture Component
 * Specialized camera for color analysis with face guidance overlay
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  X,
  Sun,
  SunDim,
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
  RotateCcw,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { handleCameraError, showPermissionDeniedToast } from '@/lib/camera-permissions';

interface CameraAnalysis {
  overallScore: number;
  lighting: 'good' | 'low' | 'overexposed';
  isReady: boolean;
  tips: string[];
}

interface ChromaticCameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  onCancel: () => void;
}

export function ChromaticCameraCapture({
  onCapture,
  onCancel
}: ChromaticCameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CameraAnalysis | null>(null);

  const QUALITY_THRESHOLD = 60;

  // Handle camera access error
  const handleCameraAccessError = useCallback((error: string | DOMException) => {
    console.error('[ChromaticCamera] Access error:', error);
    handleCameraError(error);
    setCameraError(typeof error === 'string' ? error : error.message);
  }, []);

  // Analyze lighting from video frame
  const analyzeFrame = useCallback(() => {
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sample center region for face lighting
    const sampleSize = 100;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    const startX = (video.videoWidth - sampleSize) / 2;
    const startY = (video.videoHeight - sampleSize) / 2;
    
    ctx.drawImage(video, startX, startY, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);
    
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;
    
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
    }
    
    const avgBrightness = totalBrightness / (data.length / 4);
    
    let lighting: 'good' | 'low' | 'overexposed';
    let lightingScore: number;
    
    if (avgBrightness < 60) {
      lighting = 'low';
      lightingScore = avgBrightness;
    } else if (avgBrightness > 200) {
      lighting = 'overexposed';
      lightingScore = 100 - (avgBrightness - 200);
    } else {
      lighting = 'good';
      lightingScore = 100 - Math.abs(130 - avgBrightness) * 0.5;
    }
    
    const overallScore = Math.round(Math.max(0, Math.min(100, lightingScore)));
    
    const tips: string[] = [];
    if (lighting === 'low') tips.push('Procure um local com mais luz natural');
    if (lighting === 'overexposed') tips.push('Evite luz direta no rosto');
    if (overallScore >= QUALITY_THRESHOLD && tips.length === 0) {
      tips.push('Iluminação ótima! Mantenha essa posição');
    }
    
    setAnalysis({
      overallScore,
      lighting,
      isReady: overallScore >= QUALITY_THRESHOLD,
      tips
    });
  }, []);

  // Start analysis when webcam is ready
  const handleWebcamReady = useCallback(() => {
    setIsReady(true);
    analysisIntervalRef.current = setInterval(analyzeFrame, 300);
  }, [analyzeFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  // Handle capture
  const handleCapture = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsCapturing(true);
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 720,
        height: 720
      });

      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      onCapture(imageSrc);
    } catch (error) {
      console.error('[ChromaticCamera] Capture error:', error);
      setIsCapturing(false);
      analysisIntervalRef.current = setInterval(analyzeFrame, 300);
    }
  }, [onCapture, analyzeFrame]);

  const getStatusIcon = (lighting: string) => {
    const iconClass = 'w-4 h-4';
    if (lighting === 'good') return <Sun className={cn(iconClass, 'text-green-500')} />;
    if (lighting === 'low') return <SunDim className={cn(iconClass, 'text-amber-500')} />;
    return <AlertCircle className={cn(iconClass, 'text-red-500')} />;
  };

  const getLightingText = (lighting: string) => {
    if (lighting === 'good') return 'Luz ideal';
    if (lighting === 'low') return 'Pouca luz';
    return 'Muita luz';
  };

  const scoreColor = analysis?.overallScore
    ? analysis.overallScore >= QUALITY_THRESHOLD
      ? 'bg-green-500'
      : analysis.overallScore >= 40
        ? 'bg-amber-500'
        : 'bg-red-500'
    : 'bg-muted';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative"
    >
      {/* Hidden canvas for analysis */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera View */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-sm mx-auto">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.9}
          videoConstraints={{
            facingMode: 'user',
            width: { ideal: 720 },
            height: { ideal: 720 },
            aspectRatio: 1
          }}
          onUserMedia={handleWebcamReady}
          onUserMediaError={handleCameraAccessError}
          className="w-full h-full object-cover"
          mirrored
        />

        {/* Camera Error State */}
        {cameraError && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-white font-medium mb-2">Câmera Indisponível</h3>
            <p className="text-gray-400 text-sm mb-4">
              Não foi possível acessar a câmera. Verifique as permissões do navegador.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-white border-white/30"
              >
                <Settings className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Face Guide Overlay */}
        {isReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "w-48 h-56 border-2 rounded-full transition-colors duration-300",
                analysis?.isReady ? "border-green-500/70" : "border-white/50"
              )}
            />
          </div>
        )}

        {/* Loading Overlay */}
        {(!isReady || isCapturing) && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">
                {isCapturing ? 'Capturando...' : 'Iniciando câmera...'}
              </p>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Quality Score Badge */}
        {analysis && isReady && !isCapturing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 left-3"
          >
            <div className={cn(
              "px-3 py-1.5 rounded-full text-white text-sm font-medium flex items-center gap-2",
              analysis.isReady ? "bg-green-500/90" : "bg-amber-500/90"
            )}>
              {analysis.isReady ? (
                <Check className="w-4 h-4" />
              ) : (
                getStatusIcon(analysis.lighting)
              )}
              {analysis.overallScore}%
            </div>
          </motion.div>
        )}
      </div>

      {/* Analysis Feedback */}
      <AnimatePresence mode="wait">
        {analysis && isReady && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 space-y-3"
          >
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Qualidade da luz</span>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(analysis.lighting)}
                  <span className={cn(
                    'font-medium',
                    analysis.isReady ? 'text-green-500' : 'text-amber-500'
                  )}>
                    {getLightingText(analysis.lighting)}
                  </span>
                </div>
              </div>
              <Progress
                value={analysis.overallScore}
                className={cn('h-2', scoreColor)}
              />
            </div>

            {/* Tips */}
            {analysis.tips.length > 0 && (
              <p className="text-xs text-center text-muted-foreground px-4">
                💡 {analysis.tips[0]}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capture Button */}
      <div className="flex justify-center mt-4">
        <Button
          size="lg"
          onClick={handleCapture}
          disabled={!isReady || isCapturing}
          className={cn(
            "px-8 shadow-glow transition-all duration-300",
            analysis?.isReady 
              ? "gradient-primary text-primary-foreground" 
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {isCapturing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Capturando...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              {analysis?.isReady ? 'Capturar' : 'Capturar mesmo assim'}
            </>
          )}
        </Button>
      </div>

      {/* Help text */}
      <p className="text-center text-sm text-muted-foreground mt-3 px-4">
        Posicione seu rosto dentro do círculo, com luz natural no rosto
      </p>
    </motion.div>
  );
}
