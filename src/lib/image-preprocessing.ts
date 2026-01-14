/**
 * Image preprocessing utilities for Virtual Try-On
 * Normalizes avatar and garment images to optimize model success rate
 */

/**
 * Prepares an avatar image for virtual try-on by:
 * 1. Cropping to 3:4 aspect ratio (portrait)
 * 2. Resizing to target dimensions
 * 3. Converting to JPEG (removes alpha, reduces inconsistencies)
 */
export async function prepareAvatarForTryOn(
  imageUrl: string,
  options: {
    targetHeight?: number;
    jpegQuality?: number;
  } = {}
): Promise<Blob> {
  const { targetHeight = 1365, jpegQuality = 0.92 } = options;
  const targetAspect = 3 / 4; // Portrait aspect ratio for fashion
  const targetWidth = Math.round(targetHeight * targetAspect);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Calculate crop dimensions to achieve 3:4 aspect ratio
      let srcWidth = img.width;
      let srcHeight = img.height;
      let srcX = 0;
      let srcY = 0;

      const imgAspect = img.width / img.height;

      if (imgAspect > targetAspect) {
        // Image is too wide - crop horizontally (keep center)
        srcWidth = img.height * targetAspect;
        srcX = (img.width - srcWidth) / 2;
      } else if (imgAspect < targetAspect) {
        // Image is too tall - crop vertically (keep top for face)
        srcHeight = img.width / targetAspect;
        // Keep more of the top (head) and less of the bottom (feet)
        srcY = 0; // Start from top to preserve head/face
      }

      // Set canvas to target dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Fill with neutral background (in case of transparency)
      ctx.fillStyle = "#1a1a2e"; // Dark background matching app theme
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw the cropped and resized image
      ctx.drawImage(
        img,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // Export as JPEG blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create image blob"));
          }
        },
        "image/jpeg",
        jpegQuality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for preprocessing"));
    };

    img.src = imageUrl;
  });
}

/**
 * Prepares a garment image for virtual try-on by:
 * 1. Resizing to max dimensions (keeping aspect ratio)
 * 2. Converting to JPEG
 */
export async function prepareGarmentForTryOn(
  imageUrl: string,
  options: {
    maxSize?: number;
    jpegQuality?: number;
  } = {}
): Promise<Blob> {
  const { maxSize = 1024, jpegQuality = 0.92 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Calculate target dimensions (keep aspect ratio)
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height / width) * maxSize);
          width = maxSize;
        } else {
          width = Math.round((width / height) * maxSize);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Fill with white background (for transparent garments)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Draw the resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create garment blob"));
          }
        },
        "image/jpeg",
        jpegQuality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load garment image for preprocessing"));
    };

    img.src = imageUrl;
  });
}

/**
 * Checks if an image needs preprocessing based on dimensions and format
 */
export async function analyzeImage(
  imageUrl: string
): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
  needsProcessing: boolean;
  isPortrait: boolean;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const targetAspect = 3 / 4;
      const aspectDiff = Math.abs(aspectRatio - targetAspect);

      resolve({
        width: img.width,
        height: img.height,
        aspectRatio,
        isPortrait: img.height > img.width,
        // Needs processing if aspect ratio is off or image is too large
        needsProcessing:
          aspectDiff > 0.1 || img.width > 1500 || img.height > 2000,
      });
    };

    img.onerror = () => {
      reject(new Error("Failed to analyze image"));
    };

    img.src = imageUrl;
  });
}
