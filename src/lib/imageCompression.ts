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
  
  console.log(`🖼️ Compressing image: ${file.name}`);
  console.log(`📏 Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`🎯 Target size: ${maxSizeInMB}MB`);

  // If file is already small enough, return it
  if (file.size <= targetSizeBytes) {
    console.log(`✅ File already under ${maxSizeInMB}MB, returning original`);
    return file;
  }

  return new Promise((resolve, reject) => {
    const attemptCompression = (currentQuality: number, attempt: number = 1): void => {
      console.log(`🔄 Attempt ${attempt}: Trying quality ${currentQuality.toFixed(2)}`);
      
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
          const compressedSizeMB = compressedFile.size / 1024 / 1024;
          console.log(`📊 Compressed to: ${compressedSizeMB.toFixed(2)}MB`);
          
          // If compressed file meets size requirement, return it
          if (compressedFile.size <= targetSizeBytes) {
            console.log(`✅ Success! Final size: ${compressedSizeMB.toFixed(2)}MB`);
            resolve(compressedFile);
            return;
          }

          // If we've tried enough times or quality is too low, give up
          if (attempt >= 6 || currentQuality <= 0.1) {
            console.log(`❌ Failed after ${attempt} attempts. Final size: ${compressedSizeMB.toFixed(2)}MB`);
            reject(new Error(`Unable to compress image below ${maxSizeInMB}MB. Please use a smaller image or lower resolution.`));
            return;
          }

          // Try again with lower quality
          const nextQuality = Math.max(0.1, currentQuality - 0.15);
          console.log(`🔄 Still ${compressedSizeMB.toFixed(2)}MB, trying again with quality ${nextQuality.toFixed(2)}`);
          attemptCompression(nextQuality, attempt + 1);
        },
        error: (err: Error) => {
          console.error(`❌ Compression error:`, err);
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