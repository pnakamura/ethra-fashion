/**
 * Privacy utilities for Virtual Try-On
 * Client-side face detection and blur for maximum privacy
 */

/**
 * Simple face detection using brightness and skin tone heuristics
 * This is a lightweight alternative to MediaPipe for basic privacy
 */
export async function detectFaceRegion(
  imageBlob: Blob
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Use smaller size for faster processing
      const maxSize = 400;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Scan top third of image for skin-tone clusters
      const searchHeight = Math.floor(canvas.height * 0.4);
      const skinPixels: { x: number; y: number }[] = [];

      for (let y = 0; y < searchHeight; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];

          // Simple skin tone detection (works for various skin tones)
          if (isSkinTone(r, g, b)) {
            skinPixels.push({ x, y });
          }
        }
      }

      if (skinPixels.length < 50) {
        resolve(null);
        return;
      }

      // Find bounding box of skin pixels
      const xs = skinPixels.map(p => p.x);
      const ys = skinPixels.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      // Scale back to original dimensions and add padding
      const padding = 0.2;
      const width = (maxX - minX) / scale;
      const height = (maxY - minY) / scale;
      
      resolve({
        x: Math.max(0, (minX / scale) - width * padding),
        y: Math.max(0, (minY / scale) - height * padding),
        width: width * (1 + padding * 2),
        height: height * (1 + padding * 2)
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Check if RGB values match common skin tones
 */
function isSkinTone(r: number, g: number, b: number): boolean {
  // Multiple skin tone ranges for inclusivity
  const isBrightSkin = r > 95 && g > 40 && b > 20 &&
    Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
    Math.abs(r - g) > 15 && r > g && r > b;

  const isDarkSkin = r > 60 && g > 40 && b > 30 &&
    r > g && g > b &&
    (r - b) > 10 && (r - g) < 100;

  const isMediumSkin = r > 80 && g > 50 && b > 35 &&
    r > g && g >= b &&
    Math.abs(r - g) < 80;

  return isBrightSkin || isDarkSkin || isMediumSkin;
}

/**
 * Apply blur to face region in an image
 */
export async function blurFaceInImage(
  imageBlob: Blob,
  options: {
    blurRadius?: number;
    faceRegion?: { x: number; y: number; width: number; height: number } | null;
  } = {}
): Promise<Blob> {
  const { blurRadius = 30 } = options;

  return new Promise(async (resolve, reject) => {
    // Detect face if not provided
    let faceRegion = options.faceRegion;
    if (!faceRegion) {
      faceRegion = await detectFaceRegion(imageBlob);
    }

    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      if (faceRegion) {
        // Create elliptical blur for more natural look
        const centerX = faceRegion.x + faceRegion.width / 2;
        const centerY = faceRegion.y + faceRegion.height / 2;
        const radiusX = faceRegion.width / 2;
        const radiusY = faceRegion.height / 2;

        // Save state
        ctx.save();

        // Create elliptical clip path
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.clip();

        // Apply blur filter to clipped region
        ctx.filter = `blur(${blurRadius}px)`;
        ctx.drawImage(img, 0, 0);

        // Restore state
        ctx.restore();
      }

      // Export as JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blurred image'));
          }
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for blur'));
    };

    img.src = url;
  });
}

/**
 * Check if an image has a detectable face
 */
export async function hasFace(imageBlob: Blob): Promise<boolean> {
  const region = await detectFaceRegion(imageBlob);
  return region !== null;
}

/**
 * Privacy info for UI display
 */
export const PRIVACY_INFO = {
  localProcessing: {
    title: 'Processamento Local',
    description: 'Blur facial é aplicado no seu dispositivo antes do upload'
  },
  tempStorage: {
    title: 'Armazenamento Temporário',
    description: 'Imagens temporárias são deletadas automaticamente em 24h'
  },
  noOriginal: {
    title: 'Sem Armazenamento Original',
    description: 'Apenas versões processadas são enviadas para análise'
  }
} as const;
