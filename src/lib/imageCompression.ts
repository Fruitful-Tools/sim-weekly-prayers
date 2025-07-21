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
    maxSizeInMB = 1,
    maxWidthOrHeight = 1920,
    quality = 0.8
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidthOrHeight) {
          height = (height * maxWidthOrHeight) / width;
          width = maxWidthOrHeight;
        }
      } else {
        if (height > maxWidthOrHeight) {
          width = (width * maxWidthOrHeight) / height;
          height = maxWidthOrHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      const compressAndCheck = (currentQuality: number): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            // Check if file size is acceptable or if we've tried enough
            if (blob.size <= maxSizeInMB * 1024 * 1024 || currentQuality <= 0.1) {
              resolve(compressedFile);
            } else {
              // Try with lower quality
              compressAndCheck(currentQuality - 0.1);
            }
          },
          file.type,
          currentQuality
        );
      };

      compressAndCheck(quality);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
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