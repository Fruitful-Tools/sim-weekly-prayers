import { supabase } from '@/integrations/supabase/client';

/**
 * Extracts the file path from a Supabase storage URL
 * Example: https://...supabase.co/storage/v1/object/public/prayer-images/prayer-school/file.jpg
 * Returns: prayer-school/file.jpg
 */
export const extractFilePathFromUrl = (url: string): string | null => {
  if (!url) return null;

  try {
    // Only handle Supabase storage URLs
    if (url.includes('/storage/v1/object/public/prayer-images/')) {
      const parts = url.split('/storage/v1/object/public/prayer-images/');
      return parts[1] || null;
    }

    // Check if it's a Supabase domain (additional safety check)
    if (url.includes('supabase.co') || url.includes('supabase.in')) {
      // Extract file path for Supabase URLs even if format is slightly different
      const match = url.match(/\/prayer-images\/(.+)$/);
      return match ? match[1] : null;
    }

    // External URLs (imgur, cloudinary, etc.) should not be deleted
    return null;
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
    return null;
  }
};

/**
 * Deletes an image from Supabase storage using its URL
 */
export const deleteImageFromStorage = async (
  imageUrl: string
): Promise<boolean> => {
  if (!imageUrl) return true;

  console.log('🔍 Analyzing image URL for deletion:', imageUrl);

  const filePath = extractFilePathFromUrl(imageUrl);
  if (!filePath) {
    // This is expected for external URLs (imgur, etc.) - no cleanup needed
    console.log('🌐 External URL detected, skipping storage deletion:', imageUrl);
    return true;
  }

  console.log('📂 Extracted file path for deletion:', filePath);

  try {
    const { data, error } = await supabase.storage
      .from('prayer-images')
      .remove([filePath]);

    if (error) {
      console.error('❌ Error deleting image from storage:', error);
      return false;
    }

    // Check if the file was actually deleted
    // Supabase returns an array of deleted file info or empty array if nothing was deleted
    if (!data || data.length === 0) {
      console.warn(
        '⚠️ File deletion returned empty data - file may not have been deleted:',
        filePath
      );

      // Verify if file still exists by trying to get its public URL and checking if accessible
      const { data: urlData } = supabase.storage
        .from('prayer-images')
        .getPublicUrl(filePath);

      console.log('🔗 Checking if file still exists at:', urlData.publicUrl);

      // Try to fetch the URL to see if file still exists
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.error('❌ File still exists after deletion attempt:', filePath);
          return false;
        } else {
          console.log('✅ File appears to be deleted (HEAD request failed):', filePath);
        }
      } catch (fetchError) {
        // If fetch fails, the file might be deleted (or network issue)
        console.log('✅ File appears to be deleted (fetch failed):', filePath);
      }
    } else {
      console.log(
        '✅ Successfully deleted image:',
        filePath,
        'Response data:',
        data
      );
    }

    return true;
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    return false;
  }
};

/**
 * Deletes multiple images from Supabase storage
 */
export const deleteImagesFromStorage = async (
  imageUrls: string[]
): Promise<boolean> => {
  console.log('🗑️ Starting batch deletion for images:', imageUrls);

  const filePaths = imageUrls
    .map((url) => {
      const path = extractFilePathFromUrl(url);
      console.log(`📂 URL: ${url} → Path: ${path}`);
      return path;
    })
    .filter((path) => path !== null) as string[];

  if (filePaths.length === 0) {
    console.log('🌐 No Supabase storage files to delete (all external URLs)');
    return true;
  }

  console.log('📂 File paths to delete:', filePaths);

  try {
    const { data, error } = await supabase.storage
      .from('prayer-images')
      .remove(filePaths);

    if (error) {
      console.error('❌ Error deleting images from storage:', error);
      return false;
    }

    console.log('✅ Successfully deleted images:', filePaths, 'Response:', data);
    return true;
  } catch (error) {
    console.error('❌ Error deleting images:', error);
    return false;
  }
};
