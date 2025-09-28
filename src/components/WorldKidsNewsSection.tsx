import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';
import { toast } from 'sonner';

interface WorldKidsNewsData {
  images: File[];
  imagePreviews: string[];
  translations: {
    en: { title: string; content: string };
    'zh-TW': { title: string; content: string };
  };
}

interface WorldKidsNewsSectionProps {
  data: WorldKidsNewsData;
  onChange: (data: WorldKidsNewsData) => void;
}

export default function WorldKidsNewsSection({ data, onChange }: WorldKidsNewsSectionProps) {
  const { t } = useTranslation();
  const [compressing, setCompressing] = useState(false);

  const handleImageChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Limit to 3 images
      const selectedFiles = files.slice(0, 3 - data.images.length);
      
      if (selectedFiles.length + data.images.length > 3) {
        toast.error('最多只能上傳 3 張圖片');
        return;
      }

      setCompressing(true);
      const processedFiles: File[] = [];
      const newPreviews: string[] = [];

      try {
        for (const file of selectedFiles) {
          if (!file.type.startsWith('image/')) {
            toast.error(t('prayer.invalidFileType'));
            continue;
          }

          // Create preview
          const preview = URL.createObjectURL(file);
          newPreviews.push(preview);

          // Compress image
          const compressedFile = await compressImage(file);
          processedFiles.push(compressedFile);
        }

        onChange({
          ...data,
          images: [...data.images, ...processedFiles],
          imagePreviews: [...data.imagePreviews, ...newPreviews],
        });
      } catch (error) {
        console.error('Error processing images:', error);
        toast.error('圖片處理失敗，請重試');
      } finally {
        setCompressing(false);
      }
    },
    [data, onChange, t]
  );

  const removeImage = (index: number) => {
    const newImages = [...data.images];
    const newPreviews = [...data.imagePreviews];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);

    onChange({
      ...data,
      images: newImages,
      imagePreviews: newPreviews,
    });
  };

  const updateTranslation = (language: 'en' | 'zh-TW', field: 'title' | 'content', value: string) => {
    onChange({
      ...data,
      translations: {
        ...data.translations,
        [language]: {
          ...data.translations[language],
          [field]: value,
        },
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>萬國小新聞 (可選)</CardTitle>
        <CardDescription>
          為此禱告添加兒童友善版本，包含最多 3 張圖片和可選的雙語內容
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <Label>圖片 (最多 3 張)</Label>
          
          {/* Upload Button */}
          {data.images.length < 3 && (
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={compressing}
                onClick={() => document.getElementById('worldKidsNewsImages')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {compressing ? '處理中...' : '選擇圖片'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.images.length}/3 張圖片
              </span>
            </div>
          )}

          <input
            id="worldKidsNewsImages"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageChange}
          />

          {/* Image Previews */}
          {data.imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {data.imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-video rounded-lg overflow-hidden border">
                    <img
                      src={preview}
                      alt={`預覽 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Translations Section */}
        <div className="space-y-4">
          <Label>內容 (可選)</Label>
          <Tabs defaultValue="zh-TW" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="zh-TW">中文</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            
            <TabsContent value="zh-TW" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="worldKidsNews-title-zh">標題</Label>
                <Input
                  id="worldKidsNews-title-zh"
                  value={data.translations['zh-TW'].title}
                  onChange={(e) => updateTranslation('zh-TW', 'title', e.target.value)}
                  placeholder="輸入萬國小新聞標題..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="worldKidsNews-content-zh">內容</Label>
                <Textarea
                  id="worldKidsNews-content-zh"
                  value={data.translations['zh-TW'].content}
                  onChange={(e) => updateTranslation('zh-TW', 'content', e.target.value)}
                  placeholder="輸入萬國小新聞內容..."
                  className="min-h-[120px]"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="en" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="worldKidsNews-title-en">Title</Label>
                <Input
                  id="worldKidsNews-title-en"
                  value={data.translations.en.title}
                  onChange={(e) => updateTranslation('en', 'title', e.target.value)}
                  placeholder="Enter World Kids News title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="worldKidsNews-content-en">Content</Label>
                <Textarea
                  id="worldKidsNews-content-en"
                  value={data.translations.en.content}
                  onChange={(e) => updateTranslation('en', 'content', e.target.value)}
                  placeholder="Enter World Kids News content..."
                  className="min-h-[120px]"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}