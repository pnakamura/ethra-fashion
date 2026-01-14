/**
 * Smart Camera Hook
 * Real-time image quality analysis for optimal virtual try-on input
 */

import { useCallback, useRef, useState } from 'react';

export interface CameraAnalysis {
  lighting: 'good' | 'low' | 'overexposed';
  lightingScore: number;
  backgroundComplexity: 'simple' | 'moderate' | 'complex';
  backgroundScore: number;
  bodyPosition: 'centered' | 'off-center' | 'not-detected';
  positionScore: number;
  overallScore: number;
  isReady: boolean;
  tips: string[];
}

const QUALITY_THRESHOLD = 65;

export function useSmartCamera() {
  const [analysis, setAnalysis] = useState<CameraAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisIntervalRef = useRef<number | null>(null);

  /**
   * Analyze lighting from image brightness
   */
  const analyzeLighting = useCallback((imageData: ImageData): { 
    status: 'good' | 'low' | 'overexposed'; 
    score: number 
  } => {
    const pixels = imageData.data;
    let totalBrightness = 0;
    let brightPixels = 0;
    let darkPixels = 0;
    const pixelCount = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      
      if (brightness > 240) brightPixels++;
      if (brightness < 30) darkPixels++;
    }

    const avgBrightness = totalBrightness / pixelCount;
    const overexposedRatio = brightPixels / pixelCount;
    const underexposedRatio = darkPixels / pixelCount;

    // Score calculation (0-100)
    let score = 100;
    
    // Penalize for poor lighting
    if (avgBrightness < 60) {
      score -= Math.min(50, (60 - avgBrightness) * 1.5);
    } else if (avgBrightness > 200) {
      score -= Math.min(50, (avgBrightness - 200) * 1.5);
    }
    
    // Penalize for over/under exposed areas
    if (overexposedRatio > 0.1) {
      score -= overexposedRatio * 100;
    }
    if (underexposedRatio > 0.2) {
      score -= underexposedRatio * 80;
    }

    let status: 'good' | 'low' | 'overexposed';
    if (avgBrightness < 60 || underexposedRatio > 0.3) {
      status = 'low';
    } else if (avgBrightness > 200 || overexposedRatio > 0.2) {
      status = 'overexposed';
    } else {
      status = 'good';
    }

    return { status, score: Math.max(0, Math.min(100, score)) };
  }, []);

  /**
   * Analyze background complexity using edge detection and color variance
   */
  const analyzeBackground = useCallback((imageData: ImageData): {
    status: 'simple' | 'moderate' | 'complex';
    score: number;
  } => {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;

    // Sample edge regions (top, left, right strips)
    const edgePixels: number[][] = [];
    const edgeWidth = Math.floor(width * 0.15);
    const edgeHeight = Math.floor(height * 0.15);

    // Top edge
    for (let y = 0; y < edgeHeight; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        edgePixels.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
      }
    }

    // Left edge
    for (let y = edgeHeight; y < height - edgeHeight; y++) {
      for (let x = 0; x < edgeWidth; x++) {
        const idx = (y * width + x) * 4;
        edgePixels.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
      }
    }

    // Right edge
    for (let y = edgeHeight; y < height - edgeHeight; y++) {
      for (let x = width - edgeWidth; x < width; x++) {
        const idx = (y * width + x) * 4;
        edgePixels.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
      }
    }

    // Calculate color variance
    if (edgePixels.length === 0) {
      return { status: 'simple', score: 100 };
    }

    const avgColor = [0, 0, 0];
    edgePixels.forEach(p => {
      avgColor[0] += p[0];
      avgColor[1] += p[1];
      avgColor[2] += p[2];
    });
    avgColor[0] /= edgePixels.length;
    avgColor[1] /= edgePixels.length;
    avgColor[2] /= edgePixels.length;

    let variance = 0;
    edgePixels.forEach(p => {
      variance += Math.pow(p[0] - avgColor[0], 2);
      variance += Math.pow(p[1] - avgColor[1], 2);
      variance += Math.pow(p[2] - avgColor[2], 2);
    });
    variance = Math.sqrt(variance / (edgePixels.length * 3));

    // Score: lower variance = simpler background = higher score
    const score = Math.max(0, Math.min(100, 100 - variance * 1.5));
    
    let status: 'simple' | 'moderate' | 'complex';
    if (variance < 25) {
      status = 'simple';
    } else if (variance < 50) {
      status = 'moderate';
    } else {
      status = 'complex';
    }

    return { status, score };
  }, []);

  /**
   * Analyze body position (center detection using brightness distribution)
   */
  const analyzeBodyPosition = useCallback((imageData: ImageData): {
    status: 'centered' | 'off-center' | 'not-detected';
    score: number;
  } => {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;

    // Divide image into 3 vertical sections
    const leftThird = Math.floor(width / 3);
    const rightThird = Math.floor(width * 2 / 3);

    let leftDarkness = 0;
    let centerDarkness = 0;
    let rightDarkness = 0;
    let leftCount = 0;
    let centerCount = 0;
    let rightCount = 0;

    // Sample middle 60% of height
    const startY = Math.floor(height * 0.2);
    const endY = Math.floor(height * 0.8);

    for (let y = startY; y < endY; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        const darkness = 255 - brightness; // Invert: darker = higher value

        if (x < leftThird) {
          leftDarkness += darkness;
          leftCount++;
        } else if (x < rightThird) {
          centerDarkness += darkness;
          centerCount++;
        } else {
          rightDarkness += darkness;
          rightCount++;
        }
      }
    }

    const avgLeft = leftDarkness / Math.max(1, leftCount);
    const avgCenter = centerDarkness / Math.max(1, centerCount);
    const avgRight = rightDarkness / Math.max(1, rightCount);

    // Body should be darker (wearing clothes) in center
    const centerDominance = avgCenter / Math.max(1, (avgLeft + avgRight) / 2);

    let status: 'centered' | 'off-center' | 'not-detected';
    let score: number;

    if (centerDominance > 1.15) {
      // Good center mass
      status = 'centered';
      score = Math.min(100, 70 + centerDominance * 15);
    } else if (centerDominance > 0.9) {
      // Acceptable but not ideal
      status = 'off-center';
      score = 50 + centerDominance * 20;
    } else {
      // Very off-center or no clear body detected
      status = 'not-detected';
      score = 30;
    }

    return { status, score: Math.min(100, score) };
  }, []);

  /**
   * Generate tips based on analysis
   */
  const generateTips = useCallback((
    lighting: { status: string; score: number },
    background: { status: string; score: number },
    position: { status: string; score: number }
  ): string[] => {
    const tips: string[] = [];

    if (lighting.status === 'low') {
      tips.push('Aumente a iluminação ou vá para um local mais claro');
    } else if (lighting.status === 'overexposed') {
      tips.push('Reduza a luz ou evite luz direta');
    }

    if (background.status === 'complex') {
      tips.push('Use um fundo mais simples (parede lisa)');
    }

    if (position.status === 'off-center') {
      tips.push('Centralize-se no quadro');
    } else if (position.status === 'not-detected') {
      tips.push('Posicione-se de corpo inteiro no centro');
    }

    if (tips.length === 0) {
      tips.push('Ótimo! Pose frontal com braços afastados');
    }

    return tips;
  }, []);

  /**
   * Analyze a video frame or image
   */
  const analyzeFrame = useCallback((
    canvas: HTMLCanvasElement | null,
    ctx: CanvasRenderingContext2D | null
  ): CameraAnalysis | null => {
    if (!canvas || !ctx) return null;

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const lighting = analyzeLighting(imageData);
      const background = analyzeBackground(imageData);
      const position = analyzeBodyPosition(imageData);

      const overallScore = Math.round(
        lighting.score * 0.35 +
        background.score * 0.30 +
        position.score * 0.35
      );

      const tips = generateTips(lighting, background, position);

      return {
        lighting: lighting.status,
        lightingScore: Math.round(lighting.score),
        backgroundComplexity: background.status,
        backgroundScore: Math.round(background.score),
        bodyPosition: position.status,
        positionScore: Math.round(position.score),
        overallScore,
        isReady: overallScore >= QUALITY_THRESHOLD,
        tips
      };
    } catch (error) {
      console.error('[SmartCamera] Analysis error:', error);
      return null;
    }
  }, [analyzeLighting, analyzeBackground, analyzeBodyPosition, generateTips]);

  /**
   * Start continuous analysis of webcam feed
   */
  const startAnalysis = useCallback((
    videoElement: HTMLVideoElement,
    intervalMs: number = 500
  ) => {
    if (analysisIntervalRef.current) {
      window.clearInterval(analysisIntervalRef.current);
    }

    setIsAnalyzing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const analyze = () => {
      if (!videoElement.videoWidth || !videoElement.videoHeight) return;

      // Use lower resolution for faster analysis
      canvas.width = Math.min(320, videoElement.videoWidth);
      canvas.height = Math.min(426, videoElement.videoHeight);

      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const result = analyzeFrame(canvas, ctx);
        if (result) {
          setAnalysis(result);
        }
      }
    };

    // Initial analysis
    analyze();

    // Continuous analysis
    analysisIntervalRef.current = window.setInterval(analyze, intervalMs);
  }, [analyzeFrame]);

  /**
   * Stop continuous analysis
   */
  const stopAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      window.clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    setIsAnalyzing(false);
  }, []);

  /**
   * Analyze a single image
   */
  const analyzeImage = useCallback(async (imageUrl: string): Promise<CameraAnalysis | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(640, img.width);
        canvas.height = Math.min(853, img.height);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const result = analyzeFrame(canvas, ctx);
          resolve(result);
        } else {
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  }, [analyzeFrame]);

  return {
    analysis,
    isAnalyzing,
    startAnalysis,
    stopAnalysis,
    analyzeImage,
    analyzeFrame,
    QUALITY_THRESHOLD
  };
}
