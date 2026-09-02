/**
 * Image processing utilities — all client-side, no network.
 * Reads a File, downscales via canvas, and re-encodes (WebP if supported, else JPEG).
 */

export interface ProcessedImage {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

function supportsWebP(): boolean {
  // Cache the check.
  if (typeof document === 'undefined') return true;
  const cached = (supportsWebP as unknown as { _c?: boolean })._c;
  if (cached !== undefined) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ok = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  (supportsWebP as unknown as { _c?: boolean })._c = ok;
  return ok;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('تعذّر قراءة الصورة. تأكد أن الملف صورة صالحة.'));
    };
    img.src = url;
  });
}

function drawScaled(
  img: HTMLImageElement,
  maxDim: number,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  let { width, height } = img;
  if (width <= 0 || height <= 0) {
    width = maxDim;
    height = maxDim;
  }
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('تعذّر معالجة الصورة في هذا المتصفح.');
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, width, height };
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('تعذّر ضغط الصورة.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Process an image File: downscale + compress. Returns a Blob ready for IndexedDB.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const originalSize = file.size;
  if (!file.type.startsWith('image/')) {
    throw new Error('الملف المختار ليس صورة.');
  }
  const img = await loadImage(file);
  const { canvas, width, height } = drawScaled(img, MAX_DIMENSION);
  const useWebP = supportsWebP();
  const mimeType = useWebP ? 'image/webp' : 'image/jpeg';

  let blob = await canvasToBlob(canvas, mimeType, QUALITY);

  // Fallback: if WebP failed for some reason, try JPEG.
  if (blob.size === 0 && useWebP) {
    blob = await canvasToBlob(canvas, 'image/jpeg', QUALITY);
  }

  return {
    blob,
    mimeType: blob.type || mimeType,
    width,
    height,
    originalSize,
    compressedSize: blob.size,
  };
}

/** Format a byte count into a human-readable Arabic-friendly string. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 ب';
  const units = ['ب', 'ك.ب', 'م.ب', 'ج.ب'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}
