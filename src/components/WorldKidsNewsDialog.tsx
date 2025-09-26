import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Link, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';
import { deleteImageFromStorage } from '@/lib/storageUtils';
import { toast } from 'sonner';

interface WorldKidsNews {
  id: string;
  week_date: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

interface WorldKidsNewsFormData {
  week_date: string;
  image1: File | string | null;
  image2: File | string | null;
  image3: File | string | null;
}

interface WorldKidsNewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  news?: WorldKidsNews | null;
}

export default function WorldKidsNewsDialog({
  open,
  onOpenChange,
  onSuccess,
  news
}: WorldKidsNewsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageInputModes, setImageInputModes] = useState<{[key: string]: 'upload' | 'url'}>({
    image1: 'upload',
    image2: 'upload', 
    image3: 'upload'
  });
  const [imageUrls, setImageUrls] = useState<{[key: string]: string}>({
    image1: '',
    image2: '',
    image3: ''
  });
  const [imagePreviews, setImagePreviews] = useState<{[key: string]: string}>({
    image1: '',
    image2: '',
    image3: ''
  });

  const form = useForm<WorldKidsNewsFormData>({
    defaultValues: {
      week_date: '',
      image1: null,
      image2: null,
      image3: null
    }
  });

  // Reset form when dialog opens/closes or news changes
  useEffect(() => {
    if (open) {
      if (news) {
        form.reset({
          week_date: news.week_date,
          image1: news.image_urls[0] || null,
          image2: news.image_urls[1] || null,
          image3: news.image_urls[2] || null
        });
        setImagePreviews({
          image1: news.image_urls[0] || '',
          image2: news.image_urls[1] || '',
          image3: news.image_urls[2] || ''
        });
      } else {
        form.reset({
          week_date: '',
          image1: null,
          image2: null,
          image3: null
        });
        setImagePreviews({
          image1: '',
          image2: '',
          image3: ''
        });
      }
    }
    setImageUrls({
      image1: '',
      image2: '',
      image3: ''
    });
  }, [open, news, form]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>, imageKey: 'image1' | 'image2' | 'image3') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(`檔案 ${file.name} 不是有效的圖片格式`);
      return;
    }

    try {
      const compressedFile = await compressImage(file);
      form.setValue(imageKey, compressedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreviews(prev => ({
            ...prev,
            [imageKey]: e.target.result as string
          }));
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error(`圖片 ${file.name} 壓縮失敗`);
    }
  };

  const removeImage = async (imageKey: 'image1' | 'image2' | 'image3') => {
    const imageToRemove = form.getValues(imageKey);

    // If it's an existing URL (string), delete from storage
    if (typeof imageToRemove === 'string' && news) {
      try {
        await deleteImageFromStorage(imageToRemove);
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }

    form.setValue(imageKey, null);
    setImagePreviews(prev => ({
      ...prev,
      [imageKey]: ''
    }));
  };

  const handleImageUrlAdd = (imageKey: 'image1' | 'image2' | 'image3') => {
    const url = imageUrls[imageKey];
    if (!url.trim()) return;

    form.setValue(imageKey, url);
    setImagePreviews(prev => ({
      ...prev,
      [imageKey]: url
    }));
    setImageUrls(prev => ({
      ...prev,
      [imageKey]: ''
    }));
  };

  const uploadImages = async (data: WorldKidsNewsFormData): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    const images = [data.image1, data.image2, data.image3];

    for (const image of images) {
      if (!image) {
        uploadedUrls.push(''); // Placeholder for missing images
        continue;
      }

      if (typeof image === 'string') {
        // Already a URL, keep as is
        uploadedUrls.push(image);
      } else {
        // File to upload
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data: uploadData, error } = await supabase.storage
          .from('prayer-images')
          .upload(`prayer-school/${fileName}`, image);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('prayer-images')
          .getPublicUrl(uploadData.path);

        uploadedUrls.push(publicUrl);
      }
    }

    // Filter out empty URLs
    return uploadedUrls.filter(url => url !== '');
  };

  const onSubmit = async (data: WorldKidsNewsFormData) => {
    const imageCount = [data.image1, data.image2, data.image3].filter(img => img !== null).length;
    
    if (imageCount === 0) {
      toast.error('請至少上傳一張圖片');
      return;
    }

    if (imageCount !== 3) {
      toast.error('請上傳正好 3 張圖片');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload new images and keep existing URLs
      const imageUrls = await uploadImages(data);

      const newsData = {
        week_date: data.week_date,
        image_urls: imageUrls,
      };

      if (news) {
        // Update existing news
        const { error } = await supabase
          .from('world_kids_news')
          .update(newsData)
          .eq('id', news.id);

        if (error) throw error;
        toast.success('萬國小新聞已更新');
      } else {
        // Create new news
        const { error } = await supabase
          .from('world_kids_news')
          .insert([newsData]);

        if (error) throw error;
        toast.success('萬國小新聞已建立');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving world kids news:', error);
      toast.error(news ? '更新失敗' : '建立失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {news ? '編輯萬國小新聞' : '新增萬國小新聞'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Week Date */}
            <FormField
              control={form.control}
              name="week_date"
              rules={{ required: '請選擇週次日期' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>週次日期</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Images Section */}
            <div className="space-y-6">
              <FormLabel className="text-lg font-semibold">圖片上傳 (需要正好 3 張)</FormLabel>
              
              {(['image1', 'image2', 'image3'] as const).map((imageKey, index) => (
                <div key={imageKey} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">圖片 {index + 1}</h3>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={imageInputModes[imageKey] === 'upload' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setImageInputModes(prev => ({ ...prev, [imageKey]: 'upload' }))}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        上傳
                      </Button>
                      <Button
                        type="button"
                        variant={imageInputModes[imageKey] === 'url' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setImageInputModes(prev => ({ ...prev, [imageKey]: 'url' }))}
                      >
                        <Link className="h-4 w-4 mr-1" />
                        連結
                      </Button>
                    </div>
                  </div>

                  {/* Image Input */}
                  {imageInputModes[imageKey] === 'upload' ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, imageKey)}
                        className="hidden"
                        id={`${imageKey}-upload`}
                      />
                      <label htmlFor={`${imageKey}-upload`} className="cursor-pointer">
                        <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          點擊選擇圖片
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="圖片網址..."
                        value={imageUrls[imageKey]}
                        onChange={(e) => setImageUrls(prev => ({ ...prev, [imageKey]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImageUrlAdd(imageKey))}
                      />
                      <Button type="button" onClick={() => handleImageUrlAdd(imageKey)}>
                        添加
                      </Button>
                    </div>
                  )}

                  {/* Image Preview */}
                  {imagePreviews[imageKey] && (
                    <Card className="relative">
                      <CardContent className="p-2">
                        <div className="relative">
                          <img
                            src={imagePreviews[imageKey]}
                            alt={`圖片 ${index + 1} 預覽`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => removeImage(imageKey)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}

              <p className="text-sm text-muted-foreground">
                已上傳 {Object.values(imagePreviews).filter(preview => preview !== '').length} / 3 張圖片
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '處理中...' : news ? '更新' : '建立'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
