import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, GripVertical } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WorldKidsNewsData {
  images: File[];
  imagePreviews: string[];
  translations: {
    en: { title: string; content: string };
    'zh-TW': { title: string; content: string };
  };
}

interface SortableItemProps {
  id: string;
  index: number;
  preview: string;
  onRemove: (index: number) => void;
}

function SortableItem({ id, index, preview, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="w-24 h-16 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
        <img
          src={preview}
          alt={`預覽 ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1 bg-black/60 text-white rounded cursor-grab hover:bg-black/80 transition-colors"
      >
        <GripVertical className="h-3 w-3" />
      </div>
      
      {/* Sequence number */}
      <div className="absolute top-1 right-6 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
        {index + 1}
      </div>
      
      {/* Remove button */}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
      >
        <X className="h-2 w-2" />
      </Button>
    </div>
  );
}

interface WorldKidsNewsSectionProps {
  data: WorldKidsNewsData;
  onChange: (data: WorldKidsNewsData) => void;
}

export default function WorldKidsNewsSection({ data, onChange }: WorldKidsNewsSectionProps) {
  const { t } = useTranslation();
  const [compressing, setCompressing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = data.imagePreviews.findIndex((_, index) => index.toString() === active.id);
      const newIndex = data.imagePreviews.findIndex((_, index) => index.toString() === over.id);

      const newImages = arrayMove(data.images, oldIndex, newIndex);
      const newPreviews = arrayMove(data.imagePreviews, oldIndex, newIndex);

      onChange({
        ...data,
        images: newImages,
        imagePreviews: newPreviews,
      });
    }
  };

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

          {/* Image Previews with Drag and Drop */}
          {data.imagePreviews.length > 0 && (
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                拖拽圖片可調整順序 • 圖片將按此順序顯示
              </Label>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={data.imagePreviews.map((_, index) => index.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-3">
                    {data.imagePreviews.map((preview, index) => (
                      <SortableItem
                        key={index}
                        id={index.toString()}
                        index={index}
                        preview={preview}
                        onRemove={removeImage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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