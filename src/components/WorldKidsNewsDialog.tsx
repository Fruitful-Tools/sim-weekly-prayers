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
  images: (File | string)[];
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
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const form = useForm<WorldKidsNewsFormData>({
    defaultValues: {
      week_date: '',
      images: []
    }
  });

  // Reset form when dialog opens/closes or news changes
  useEffect(() => {
    if (open) {
      if (news) {
        form.reset({
          week_date: news.week_date,
          images: news.image_urls
        });
        setImagePreviews(news.image_urls);
      } else {
        form.reset({
          week_date: '',
          images: []
        });
        setImagePreviews([]);
      }
    }
    setImageUrl('');
  }, [open, news, form]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const currentImages = form.getValues('images');
    const newImages = [...currentImages];
    const newPreviews = [...imagePreviews];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check total count (enforce 3 image limit in frontend)
      if (newImages.length >= 3) {
        toast.error('最多只能上傳 3 張圖片');
        break;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`檔案 ${file.name} 不是有效的圖片格式`);
        continue;
      }

      try {
        const compressedFile = await compressImage(file);
        newImages.push(compressedFile);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string);
            setImagePreviews([...newPreviews]);
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        toast.error(`圖片 ${file.name} 壓縮失敗`);
      }
    }

    form.setValue('images', newImages);
  };

  const removeImage = async (index: number) => {
    const images = form.getValues('images');
    const imageToRemove = images[index];

    // If it's an existing URL (string), delete from storage
    if (typeof imageToRemove === 'string' && news) {
      try {
        await deleteImageFromStorage(imageToRemove);
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }

    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    form.setValue('images', newImages);
    setImagePreviews(newPreviews);
  };

  const handleImageUrlAdd = () => {
    if (!imageUrl.trim()) return;

    const currentImages = form.getValues('images');
    if (currentImages.length >= 3) {
      toast.error('最多只能上傳 3 張圖片');
      return;
    }

    const newImages = [...currentImages, imageUrl];
    const newPreviews = [...imagePreviews, imageUrl];
    
    form.setValue('images', newImages);
    setImagePreviews(newPreviews);
    setImageUrl('');
  };

  const uploadImages = async (images: (File | string)[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      if (typeof image === 'string') {
        // Already a URL, keep as is
        uploadedUrls.push(image);
      } else {
        // File to upload
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('prayer-images')
          .upload(fileName, image);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('prayer-images')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }
    }

    return uploadedUrls;
  };

  const onSubmit = async (data: WorldKidsNewsFormData) => {
    if (data.images.length === 0) {
      toast.error('請至少上傳一張圖片');
      return;
    }

    if (data.images.length !== 3) {
      toast.error('請上傳正好 3 張圖片');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload new images and keep existing URLs
      const imageUrls = await uploadImages(data.images);

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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>圖片 (需要正好 3 張)</FormLabel>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={imageInputMode === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageInputMode('upload')}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    上傳
                  </Button>
                  <Button
                    type="button"
                    variant={imageInputMode === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageInputMode('url')}
                  >
                    <Link className="h-4 w-4 mr-1" />
                    連結
                  </Button>
                </div>
              </div>

              {/* Image Input */}
              {imageInputMode === 'upload' ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Image className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      點擊選擇圖片或拖放到這裡
                    </p>
                  </label>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="圖片網址..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImageUrlAdd())}
                  />
                  <Button type="button" onClick={handleImageUrlAdd}>
                    添加
                  </Button>
                </div>
              )}

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-2">
                        <img
                          src={preview}
                          alt={`預覽 ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                已選擇 {imagePreviews.length} / 3 張圖片
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
