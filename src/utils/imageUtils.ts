/**
 * ⚡ Shared Image Optimization & File Handling Utility
 * - Handles file picking, validation, client-side canvas compression, and Base64 encoding.
 * - Efficiently scales images to max 1024px to keep payloads lightweight (~50-120KB)
 *   ensuring fast local persistence and safe sync over SQLite & Supabase.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.82,
  maxSizeMB: 8,
};

/**
 * Validates and compresses an image file to a lightweight data URL string.
 */
export async function compressAndReadImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. Validate file type
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, WebP, etc.).');
  }

  // 2. Validate maximum raw file size before processing
  const maxBytes = (opts.maxSizeMB || 8) * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Image size is too large (max ${opts.maxSizeMB}MB). Please choose a smaller image.`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read selected image file.'));
    };

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Selected file could not be decoded as an image.'));
      };

      img.onload = () => {
        try {
          let { width, height } = img;
          const maxWidth = opts.maxWidth || 1024;
          const maxHeight = opts.maxHeight || 1024;

          // Maintain aspect ratio while bounding within maxWidth & maxHeight
          if (width > maxWidth || height > maxHeight) {
            const aspect = width / height;
            if (width > height) {
              width = maxWidth;
              height = Math.round(maxWidth / aspect);
            } else {
              height = maxHeight;
              width = Math.round(maxHeight * aspect);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to raw data URL if canvas context unavailable
            resolve(e.target?.result as string);
            return;
          }

          // Use high quality image rendering on canvas
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Export as optimized JPEG/WebP data URL
          const format = file.type === 'image/png' || file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(format, opts.quality || 0.82);

          resolve(compressedDataUrl);
        } catch (err) {
          // Fallback to original read string if canvas operations fail
          if (e.target?.result && typeof e.target.result === 'string') {
            resolve(e.target.result);
          } else {
            reject(err);
          }
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Triggers native system file picker for image selection
 */
export function openImagePicker(
  onSelect: (dataUrl: string) => void,
  onError?: (err: Error) => void,
  options?: ImageOptimizationOptions
) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/jpg,image/webp,image/gif';
  input.style.display = 'none';

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return; // User cancelled picker

    try {
      const dataUrl = await compressAndReadImage(file, options);
      onSelect(dataUrl);
    } catch (err: any) {
      if (onError) {
        onError(err);
      } else {
        alert(err.message || 'Failed to process selected image.');
      }
    } finally {
      document.body.removeChild(input);
    }
  };

  document.body.appendChild(input);
  input.click();
}
