import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import WorldKidsNewsSection from '@/components/WorldKidsNewsSection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePlus, Upload, X, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage, isCompressibleImageType } from '@/lib/imageCompression';
import { deleteImageFromStorage } from '@/lib/storageUtils';

interface PrayerFormData {
  week_date: string;
  image_url?: string;
  en_title: string;
  en_content: string;
  zh_title: string;
  zh_content: string;
}

interface Translation {
  title: string;
  content: string;
  language: string;
}

interface PrayerWithTranslations {
  id: string;
  week_date: string;
  image_url?: string | null;
  translations?: Translation[];
}

interface PrayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prayer?: PrayerWithTranslations;
  onSuccess: () => void;
}

export default function PrayerDialog({
  open,
  onOpenChange,
  prayer,
  onSuccess,
}: PrayerDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>(
    'upload'
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const [worldKidsNewsData, setWorldKidsNewsData] = useState({
    images: [] as File[],
    imagePreviews: [] as string[],
    translations: {
      en: { title: '', content: '' },
      'zh-TW': { title: '', content: '' },
    },
  });

  const form = useForm<PrayerFormData>({
    defaultValues: {
      week_date: new Date().toISOString().split('T')[0],
      image_url: '',
      en_title: '',
      en_content: '',
      zh_title: '',
      zh_content: '',
    },
  });

  // Reset form when prayer prop changes or dialog opens
  useEffect(() => {
    if (open) {
      const defaultValues = {
        week_date: prayer?.week_date || new Date().toISOString().split('T')[0],
        image_url: prayer?.image_url || '',
        en_title:
          prayer?.translations?.find((t) => t.language === 'en')?.title || '',
        en_content:
          prayer?.translations?.find((t) => t.language === 'en')?.content || '',
        zh_title:
          prayer?.translations?.find((t) => t.language === 'zh-TW')?.title ||
          '',
        zh_content:
          prayer?.translations?.find((t) => t.language === 'zh-TW')?.content ||
          '',
      };

      form.reset(defaultValues);
      setImagePreview(prayer?.image_url || null);
      setImageFile(null);

      // Reset world kids news data
      setWorldKidsNewsData({
        images: [],
        imagePreviews: [],
        translations: {
          en: { title: '', content: '' },
          'zh-TW': { title: '', content: '' },
        },
      });

      // Set the correct input mode based on the existing image URL
      if (prayer?.image_url) {
        // If it's a Supabase storage URL, use upload mode since it's an uploaded image
        if (
          prayer.image_url.includes('/storage/v1/object/public/prayer-images/')
        ) {
          setImageInputMode('upload');
        } else {
          // External URL, use URL mode
          setImageInputMode('url');
        }
      } else {
        setImageInputMode('upload');
      }
    }
  }, [open, prayer, form]);

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Check file size first (before compression)
      const maxSize = 10 * 1024 * 1024; // 10MB max before compression
      if (file.size > maxSize) {
        toast({
          title: t('prayer.error'),
          description: t('prayer.fileTooLargeForCompression'),
          variant: 'destructive',
        });
        event.target.value = ''; // Clear the input
        return;
      }

      // Validate file type (only images)
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('prayer.error'),
          description: t('prayer.invalidFileType'),
          variant: 'destructive',
        });
        event.target.value = ''; // Clear the input
        return;
      }

      // Check if it's a compressible image type
      if (!isCompressibleImageType(file)) {
        toast({
          title: t('prayer.error'),
          description: t('prayer.unsupportedImageType'),
          variant: 'destructive',
        });
        event.target.value = ''; // Clear the input
        return;
      }

      setIsCompressing(true);

      try {
        let finalFile = file;

        // Check file size and compress if needed
        const maxSize = 1024 * 1024; // 1MB in bytes
        if (file.size > maxSize) {
          toast({
            title: t('prayer.compressingImage'),
            description: t('prayer.compressingImageDesc'),
          });

          finalFile = await compressImage(file, { maxSizeInMB: 1 });

          toast({
            title: t('prayer.imageCompressed'),
            description: t('prayer.imageCompressedDesc', {
              originalSize: (file.size / 1024 / 1024).toFixed(2),
              compressedSize: (finalFile.size / 1024 / 1024).toFixed(2),
            }),
          });
        }

        setImageFile(finalFile);
        const previewUrl = URL.createObjectURL(finalFile);
        setImagePreview(previewUrl);
      } catch (error) {
        console.error('Compression error:', error);

        // Check if it's the specific "too large" error from our compression algorithm
        const errorMessage =
          error instanceof Error &&
          error.message.includes('Unable to compress image below')
            ? t('prayer.fileTooLarge')
            : t('prayer.compressionFailed');

        toast({
          title: t('prayer.error'),
          description: errorMessage,
          variant: 'destructive',
        });
        event.target.value = ''; // Clear the input
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue('image_url', '');
    setIsCompressing(false);
  };

  const handleImageUrlChange = (url: string) => {
    setImagePreview(url || null);
    setImageFile(null);
    form.setValue('image_url', url);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `prayers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('prayer-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);

        // Map specific Supabase errors to user-friendly messages
        let errorMessage = t('prayer.imageUploadError');

        if (
          uploadError.message?.includes('Payload too large') ||
          uploadError.message?.includes(
            'object exceeded the maximum allowed size'
          )
        ) {
          errorMessage = t('prayer.fileTooLarge');
        } else if (uploadError.message?.includes('Invalid file type')) {
          errorMessage = t('prayer.invalidFileType');
        }

        toast({
          title: t('prayer.error'),
          description: errorMessage,
          variant: 'destructive',
        });

        return null;
      }

      const { data } = supabase.storage
        .from('prayer-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);

      toast({
        title: t('prayer.error'),
        description: t('prayer.uploadUnexpectedError'),
        variant: 'destructive',
      });

      return null;
    }
  };

  const uploadWorldKidsNewsImages = async (images: File[]): Promise<string[]> => {
    const uploadPromises = images.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `world-kids-news/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('prayer-images')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from('prayer-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    });

    return await Promise.all(uploadPromises);
  };

  const onSubmit = async (data: PrayerFormData) => {
    setIsSubmitting(true);

    try {
      let imageUrl = data.image_url;
      let oldImageUrl: string | null = null;

      // Store old image URL for deletion if we're updating
      if (prayer && prayer.image_url) {
        oldImageUrl = prayer.image_url;
      }

      // Upload new image if one was selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // Error already shown in uploadImage function
          return;
        }
      }

      // Create or update the prayer
      const prayerData = {
        week_date: data.week_date,
        image_url: imageUrl,
      };

      let prayerId: string;

      if (prayer) {
        // Update existing prayer
        const { error: prayerError } = await supabase
          .from('prayers')
          .update(prayerData)
          .eq('id', prayer.id);

        if (prayerError) throw prayerError;
        prayerId = prayer.id;

        // Delete existing translations
        await supabase
          .from('prayer_translations')
          .delete()
          .eq('prayer_id', prayer.id);
      } else {
        // Create new prayer
        const { data: newPrayer, error: prayerError } = await supabase
          .from('prayers')
          .insert(prayerData)
          .select()
          .single();

        if (prayerError) throw prayerError;
        prayerId = newPrayer.id;
      }

      // Insert translations
      const translations = [
        {
          prayer_id: prayerId,
          language: 'en',
          title: data.en_title,
          content: data.en_content,
        },
        {
          prayer_id: prayerId,
          language: 'zh-TW',
          title: data.zh_title,
          content: data.zh_content,
        },
      ];

      const { error: translationsError } = await supabase
        .from('prayer_translations')
        .insert(translations);

      if (translationsError) throw translationsError;

      // Handle World Kids News if there are images
      if (worldKidsNewsData.images.length > 0) {
        try {
          // Upload world kids news images
          const worldKidsNewsImageUrls = await uploadWorldKidsNewsImages(worldKidsNewsData.images);

          // Delete existing world kids news if updating
          if (prayer) {
            await supabase
              .from('world_kids_news')
              .delete()
              .eq('prayer_id', prayer.id);
          }

          // Create world kids news entry
          const { data: worldKidsNews, error: worldKidsNewsError } = await supabase
            .from('world_kids_news')
            .insert({
              prayer_id: prayerId,
              week_date: data.week_date,
              image_urls: worldKidsNewsImageUrls,
            })
            .select()
            .single();

          if (worldKidsNewsError) throw worldKidsNewsError;

          // Insert world kids news translations (only if there's content)
          const worldKidsNewsTranslations = [];
          
          // Add English translation if there's content
          if (worldKidsNewsData.translations.en.title || worldKidsNewsData.translations.en.content) {
            worldKidsNewsTranslations.push({
              world_kids_news_id: worldKidsNews.id,
              language: 'en',
              title: worldKidsNewsData.translations.en.title || null,
              content: worldKidsNewsData.translations.en.content || null,
            });
          }

          // Add Chinese translation if there's content
          if (worldKidsNewsData.translations['zh-TW'].title || worldKidsNewsData.translations['zh-TW'].content) {
            worldKidsNewsTranslations.push({
              world_kids_news_id: worldKidsNews.id,
              language: 'zh-TW',
              title: worldKidsNewsData.translations['zh-TW'].title || null,
              content: worldKidsNewsData.translations['zh-TW'].content || null,
            });
          }

          // Insert translations only if we have any
          if (worldKidsNewsTranslations.length > 0) {
            const { error: worldKidsNewsTranslationsError } = await supabase
              .from('world_kids_news_translations')
              .insert(worldKidsNewsTranslations);

            if (worldKidsNewsTranslationsError) throw worldKidsNewsTranslationsError;
          }
        } catch (worldKidsNewsError) {
          console.error('Error saving world kids news:', worldKidsNewsError);
          toast({
            title: t('prayer.error'),
            description: 'Failed to save 萬國小新聞. Please try again.',
            variant: 'destructive',
          });
          return;
        }
      } else if (prayer) {
        // Delete existing world kids news if no images provided during update
        await supabase
          .from('world_kids_news')
          .delete()
          .eq('prayer_id', prayer.id);
      }

      // Delete old image if a new one was uploaded and they're different
      if (oldImageUrl && imageFile && oldImageUrl !== imageUrl) {
        await deleteImageFromStorage(oldImageUrl);
      }

      toast({
        title: t('prayer.success'),
        description: prayer ? t('prayer.updated') : t('prayer.created'),
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving prayer:', error);
      toast({
        title: t('prayer.error'),
        description: t('prayer.saveError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {prayer ? t('prayer.editPrayer') : t('prayer.createPrayer')}
          </DialogTitle>
          <DialogDescription>{t('prayer.formDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Week Date */}
            <FormField
              control={form.control}
              name="week_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('prayer.weekDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload/URL */}
            <div className="space-y-4">
              <label className="text-sm font-medium">{t('prayer.image')}</label>

              {/* Toggle between upload and URL */}
              <Tabs
                value={imageInputMode}
                onValueChange={(value) =>
                  setImageInputMode(value as 'upload' | 'url')
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <Link className="h-4 w-4 mr-2" />
                    URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-2">
                  {imagePreview &&
                  (imageFile ||
                    form
                      .watch('image_url')
                      ?.includes(
                        '/storage/v1/object/public/prayer-images/'
                      )) ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Prayer preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        {t('prayer.uploadImage')}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById('image-upload')?.click()
                        }
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('prayer.selectImage')}
                      </Button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageChange}
                        disabled={isCompressing}
                        className="hidden"
                      />
                      {isCompressing && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('prayer.compressingInProgress')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('prayer.imageCompressionHint')}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url" className="space-y-2">
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleImageUrlChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {imagePreview &&
                    form.watch('image_url')?.startsWith('http') && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Prayer preview"
                          className="w-full h-48 object-cover rounded-lg"
                          onError={() => setImagePreview(null)}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Bilingual Content */}
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="zh">中文</TabsTrigger>
              </TabsList>

              <TabsContent value="en" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">English Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="en_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('prayer.title')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Prayer for [Country Name]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="en_content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('prayer.content')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter prayer content in markdown format..."
                              rows={10}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="zh" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">中文內容</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="zh_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('prayer.title')}</FormLabel>
                          <FormControl>
                            <Input placeholder="為[國家名稱]禱告" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zh_content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('prayer.content')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="請輸入禱告內容（支援 Markdown 格式）..."
                              rows={10}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* World Kids News Section */}
            <WorldKidsNewsSection
              data={worldKidsNewsData}
              onChange={setWorldKidsNewsData}
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('common.saving')
                  : prayer
                    ? t('prayer.updatePrayer')
                    : t('prayer.createPrayer')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
