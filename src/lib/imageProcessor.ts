import { removeBackground } from '@imgly/background-removal';

/**
 * AI-Powered High-Precision Background Removal Engine
 * 
 * Uses Deep Learning (BiRefNet / U2Net via @imgly/background-removal WASM/WebGPU)
 * to perfectly segment any object (cups, electronics, toys, pets, food) from
 * shadows, lighting gradients, and complex table/floor backgrounds into a transparent PNG.
 */

// Memory and Session cache for transparent images to ensure instant rendering
const processedDataUrlCache = new Map<string, string>();

export interface BackgroundRemovalOptions {
  forceRecompute?: boolean;
  timeoutMs?: number;
}

/**
 * Converts a Blob to a base64 DataURL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Advanced Color & Contrast Matting Fallback
 * Used if WebAssembly/WebWorker takes too long or fails on a constrained device
 */
function fallbackCanvasMatting(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width || 512;
        const height = img.naturalHeight || img.height || 512;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Sample four corner zones
        const sampleR: number[] = [];
        const sampleG: number[] = [];
        const sampleB: number[] = [];

        // Sample corners (16x16 pixels each)
        const cornerSize = Math.min(24, Math.floor(width / 8), Math.floor(height / 8));
        for (let dy = 0; dy < cornerSize; dy++) {
          for (let dx = 0; dx < cornerSize; dx++) {
            // Top-left
            const tl = (dy * width + dx) * 4;
            sampleR.push(data[tl]); sampleG.push(data[tl + 1]); sampleB.push(data[tl + 2]);
            // Top-right
            const tr = (dy * width + (width - 1 - dx)) * 4;
            sampleR.push(data[tr]); sampleG.push(data[tr + 1]); sampleB.push(data[tr + 2]);
            // Bottom-left
            const bl = ((height - 1 - dy) * width + dx) * 4;
            sampleR.push(data[bl]); sampleG.push(data[bl + 1]); sampleB.push(data[bl + 2]);
            // Bottom-right
            const br = ((height - 1 - dy) * width + (width - 1 - dx)) * 4;
            sampleR.push(data[br]); sampleG.push(data[br + 1]); sampleB.push(data[br + 2]);
          }
        }

        const count = sampleR.length;
        let avgR = 0, avgG = 0, avgB = 0;
        for (let i = 0; i < count; i++) {
          avgR += sampleR[i];
          avgG += sampleG[i];
          avgB += sampleB[i];
        }
        avgR /= count;
        avgG /= count;
        avgB /= count;

        // Flood fill from outer bounds with relaxed shadow/light variance
        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        for (let x = 0; x < width; x++) {
          queue.push(x, 0);
          queue.push(x, height - 1);
          visited[0 * width + x] = 1;
          visited[(height - 1) * width + x] = 1;
        }
        for (let y = 1; y < height - 1; y++) {
          queue.push(0, y);
          queue.push(width - 1, y);
          visited[y * width + 0] = 1;
          visited[y * width + (width - 1)] = 1;
        }

        let qHead = 0;
        while (qHead < queue.length) {
          const x = queue[qHead++];
          const y = queue[qHead++];
          const idx = (y * width + x) * 4;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const dr = r - avgR;
          const dg = g - avgG;
          const db = b - avgB;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);

          // If pixel is background color or bright white/light studio shadow
          const isBright = (r + g + b) / 3 > 220;
          const isBg = dist < 75 || isBright;

          if (isBg) {
            data[idx + 3] = 0; // Transparent

            const neighbors = [
              [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
            ];
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const np = ny * width + nx;
                if (!visited[np]) {
                  visited[np] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        console.warn('[MattingFallback] Failed:', e);
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/**
 * Main function: Removes background with Neural AI Segmentation
 */
export async function makeImageBackgroundTransparent(
  src: string,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  if (!src) return src;

  // 1. If it's already a transparent SVG
  if (src.startsWith('data:image/svg+xml') && !src.includes('fill="url(#bgGlow)"') && !src.includes('<rect width="512"')) {
    return src;
  }

  // 2. Check cache first
  if (!options.forceRecompute && processedDataUrlCache.has(src)) {
    return processedDataUrlCache.get(src)!;
  }

  // 3. Try Deep Learning Neural Background Removal (@imgly/background-removal)
  try {
    const timeoutMs = options.timeoutMs ?? 10000;
    
    const removalPromise = removeBackground(src, {
      model: 'isnet_fp16', // High precision, lightweight neural segmentation model
      output: {
        format: 'image/png',
        quality: 0.95,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI segmentation timed out')), timeoutMs);
    });

    const resultBlob = await Promise.race([removalPromise, timeoutPromise]);
    const dataUrl = await blobToDataUrl(resultBlob);

    processedDataUrlCache.set(src, dataUrl);
    return dataUrl;
  } catch (aiErr) {
    console.warn('[ImageProcessor] Neural segmentation notice (switching to matting fallback):', aiErr);

    // 4. Fallback to smart canvas matting
    try {
      const fallbackUrl = await fallbackCanvasMatting(src);
      processedDataUrlCache.set(src, fallbackUrl);
      return fallbackUrl;
    } catch (fallbackErr) {
      console.warn('[ImageProcessor] Fallback matting notice:', fallbackErr);
      return src;
    }
  }
}
