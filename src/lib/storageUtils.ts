import { supabase } from '@/integrations/supabase/client';

/**
 * Extracts the file path from a Supabase storage URL
 * Example: https://...supabase.co/storage/v1/object/public/prayer-images/path/to/file.jpg
 * Returns: path/to/file.jpg
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
export const deleteImageFromStorage = async (imageUrl: string): Promise<boolean> => {
  if (!imageUrl) return true;
  
  const filePath = extractFilePathFromUrl(imageUrl);
  if (!filePath) {
    // This is expected for external URLs (imgur, etc.) - no cleanup needed
    console.log('External URL detected, skipping storage deletion:', imageUrl);
    return true;
  }
  
  try {
    const { error } = await supabase.storage
      .from('prayer-images')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting image from storage:', error);
      return false;
    }
    
    console.log('Successfully deleted image:', filePath);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Deletes multiple images from Supabase storage
 */
export const deleteImagesFromStorage = async (imageUrls: string[]): Promise<boolean> => {
  const filePaths = imageUrls
    .map(url => extractFilePathFromUrl(url))
    .filter(path => path !== null) as string[];
  
  if (filePaths.length === 0) return true;
  
  try {
    const { error } = await supabase.storage
      .from('prayer-images')
      .remove(filePaths);
    
    if (error) {
      console.error('Error deleting images from storage:', error);
      return false;
    }
    
    console.log('Successfully deleted images:', filePaths);
    return true;
  } catch (error) {
    console.error('Error deleting images:', error);
    return false;
  }
};