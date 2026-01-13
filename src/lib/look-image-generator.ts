/**
 * Generates a shareable image combining outfit items
 */

interface ItemPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function calculateItemPositions(count: number, canvasWidth: number, canvasHeight: number): ItemPosition[] {
  const margin = 40;
  const contentHeight = canvasHeight - 180; // Leave space for text at bottom
  
  if (count === 1) {
    const size = Math.min(canvasWidth - margin * 2, contentHeight * 0.7);
    return [{
      x: (canvasWidth - size) / 2,
      y: margin + 40,
      width: size,
      height: size
    }];
  }
  
  if (count === 2) {
    const itemWidth = (canvasWidth - margin * 3) / 2;
    const itemHeight = contentHeight * 0.6;
    return [
      { x: margin, y: margin + 30, width: itemWidth, height: itemHeight },
      { x: margin * 2 + itemWidth, y: margin + 60, width: itemWidth, height: itemHeight }
    ];
  }
  
  if (count === 3) {
    const itemWidth = (canvasWidth - margin * 3) / 2;
    const itemHeight = contentHeight * 0.45;
    return [
      { x: (canvasWidth - itemWidth) / 2, y: margin + 20, width: itemWidth, height: itemHeight },
      { x: margin, y: margin + itemHeight + 30, width: itemWidth, height: itemHeight },
      { x: margin * 2 + itemWidth, y: margin + itemHeight + 50, width: itemWidth, height: itemHeight }
    ];
  }
  
  // 4+ items: 2x2 grid
  const cols = 2;
  const rows = Math.ceil(count / cols);
  const itemWidth = (canvasWidth - margin * (cols + 1)) / cols;
  const itemHeight = Math.min((contentHeight - margin * rows) / rows, itemWidth);
  
  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      x: margin + col * (itemWidth + margin),
      y: margin + 20 + row * (itemHeight + margin * 0.5),
      width: itemWidth,
      height: itemHeight
    };
  });
}

function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.save();
  
  // Create rounded rectangle path
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.clip();
  
  // Calculate aspect-fit dimensions
  const imgRatio = img.width / img.height;
  const boxRatio = width / height;
  
  let drawWidth = width;
  let drawHeight = height;
  let offsetX = 0;
  let offsetY = 0;
  
  if (imgRatio > boxRatio) {
    // Image is wider - fit to height
    drawHeight = height;
    drawWidth = height * imgRatio;
    offsetX = (width - drawWidth) / 2;
  } else {
    // Image is taller - fit to width
    drawWidth = width;
    drawHeight = width / imgRatio;
    offsetY = (height - drawHeight) / 2;
  }
  
  ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
  ctx.restore();
}

export async function generateLookImage(
  items: { image_url: string; category?: string }[],
  lookName: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Instagram-friendly dimensions (4:5 aspect ratio)
  canvas.width = 1080;
  canvas.height = 1350;
  
  // Background gradient (warm ivory to champagne)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#FAF9F7');
  gradient.addColorStop(1, '#F5F3EF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add subtle pattern overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
  for (let i = 0; i < canvas.width; i += 20) {
    for (let j = 0; j < canvas.height; j += 20) {
      if ((i + j) % 40 === 0) {
        ctx.fillRect(i, j, 10, 10);
      }
    }
  }
  
  // Load and position images
  const positions = calculateItemPositions(items.length, canvas.width, canvas.height);
  
  for (let i = 0; i < Math.min(items.length, positions.length); i++) {
    try {
      const img = await loadImage(items[i].image_url);
      const pos = positions[i];
      
      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 15;
      
      // Draw image with rounded corners
      drawRoundedImage(ctx, img, pos.x, pos.y, pos.width, pos.height, 16);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    } catch (error) {
      console.error('Failed to load image:', items[i].image_url, error);
    }
  }
  
  // Add look name
  ctx.font = '600 48px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#1C1917';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(lookName, canvas.width / 2, canvas.height - 100);
  
  // Subtle watermark
  ctx.font = '400 18px "Inter", system-ui, sans-serif';
  ctx.fillStyle = '#A8A29E';
  ctx.fillText('Criado com Aura', canvas.width / 2, canvas.height - 50);
  
  // Decorative line above name
  ctx.strokeStyle = '#D4B896';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 60, canvas.height - 140);
  ctx.lineTo(canvas.width / 2 + 60, canvas.height - 140);
  ctx.stroke();
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate image'));
      }
    }, 'image/png');
  });
}

export async function generateLookThumbnail(
  items: { image_url: string }[]
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Smaller thumbnail
  canvas.width = 400;
  canvas.height = 400;
  
  // Background
  ctx.fillStyle = '#FAF9F7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Grid layout for items
  const gridSize = items.length <= 1 ? 1 : 2;
  const itemSize = canvas.width / gridSize;
  
  for (let i = 0; i < Math.min(items.length, 4); i++) {
    try {
      const img = await loadImage(items[i].image_url);
      const col = i % gridSize;
      const row = Math.floor(i / gridSize);
      
      ctx.drawImage(
        img,
        col * itemSize,
        row * itemSize,
        itemSize,
        itemSize
      );
    } catch (error) {
      console.error('Failed to load thumbnail image:', error);
    }
  }
  
  return canvas.toDataURL('image/jpeg', 0.8);
}
