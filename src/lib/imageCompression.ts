import Compressor from 'compressorjs';

export interface CompressionOptions {
  maxSizeInMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxSizeInMB = 2,
    maxWidthOrHeight = 1920,
    quality = 0.8
  } = options;

  const targetSizeBytes = maxSizeInMB * 1024 * 1024;

  // If file is already small enough, return it
  if (file.size <= targetSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const attemptCompression = (currentQuality: number, attempt: number = 1): void => {
      new Compressor(file, {
        quality: currentQuality,
        maxWidth: maxWidthOrHeight,
        maxHeight: maxWidthOrHeight,
        convertSize: 5000000, // Convert PNG to JPEG if larger than 5MB
        convertTypes: ['image/png', 'image/webp'],
        mimeType: file.type === 'image/png' && file.size > 5000000 ? 'image/jpeg' : file.type,
        checkOrientation: false, // Preserve aspect ratio
        retainExif: false, // Remove EXIF data to reduce size
        success: (compressedFile: File) => {
          // If compressed file meets size requirement, return it
          if (compressedFile.size <= targetSizeBytes) {
            resolve(compressedFile);
            return;
          }

          // If we've tried enough times or quality is too low, give up
          if (attempt >= 6 || currentQuality <= 0.1) {
            reject(new Error(`Unable to compress image below ${maxSizeInMB}MB. Please use a smaller image or lower resolution.`));
            return;
          }

          // Try again with lower quality
          const nextQuality = Math.max(0.1, currentQuality - 0.15);
          attemptCompression(nextQuality, attempt + 1);
        },
        error: (err: Error) => {
          reject(new Error(`Image compression failed: ${err.message}`));
        }
      });
    };

    // Start compression with the specified quality
    attemptCompression(quality);
  });
};

export const isCompressibleImageType = (file: File): boolean => {
  const compressibleTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  return compressibleTypes.includes(file.type.toLowerCase());
};