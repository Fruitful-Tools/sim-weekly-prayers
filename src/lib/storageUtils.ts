import { supabase } from '@/integrations/supabase/client';

/**
 * Extracts the file path from a Supabase storage URL
 * Example: https://...supabase.co/storage/v1/object/public/prayer-images/path/to/file.jpg
 * Returns: path/to/file.jpg
 */
export const extractFilePathFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    // Handle both full URLs and relative paths
    if (url.includes('/storage/v1/object/public/prayer-images/')) {
      const parts = url.split('/storage/v1/object/public/prayer-images/');
      return parts[1] || null;
    }
    
    // If it's already just a file path, return as is
    if (!url.startsWith('http')) {
      return url;
    }
    
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
    console.warn('Could not extract file path from URL:', imageUrl);
    return false;
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