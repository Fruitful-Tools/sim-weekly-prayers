import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WorldKidsNewsData {
  id: string;
  image_urls: string[];
  world_kids_news_translations?: {
    title?: string;
    content?: string;
    language: string;
  }[];
}

interface WorldKidsNewsSlidesProps {
  worldKidsNews: WorldKidsNewsData;
}

export default function WorldKidsNewsSlides({ worldKidsNews }: WorldKidsNewsSlidesProps) {
  const { i18n } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const currentTranslation = worldKidsNews.world_kids_news_translations?.find(
    (t) => t.language === i18n.language
  );

  const nextImage = () => {
    if (currentImageIndex < worldKidsNews.image_urls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (!worldKidsNews.image_urls || worldKidsNews.image_urls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Title and Content */}
      {currentTranslation && (currentTranslation.title || currentTranslation.content) && (
        <div className="space-y-2">
          {currentTranslation.title && (
            <h3 className="text-lg font-semibold">{currentTranslation.title}</h3>
          )}
          {currentTranslation.content && (
            <p className="text-muted-foreground">{currentTranslation.content}</p>
          )}
        </div>
      )}

      {/* Image Carousel */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-muted">
            <img
              src={worldKidsNews.image_urls[currentImageIndex]}
              alt={`萬國小新聞 圖片 ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
            />

            {/* Navigation Arrows */}
            {worldKidsNews.image_urls.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={prevImage}
                  disabled={currentImageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={nextImage}
                  disabled={currentImageIndex === worldKidsNews.image_urls.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {worldKidsNews.image_urls.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Navigation */}
      {worldKidsNews.image_urls.length > 1 && (
        <div className="flex justify-center gap-2">
          {worldKidsNews.image_urls.map((url, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentImageIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground'
              }`}
            >
              <img
                src={url}
                alt={`縮圖 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}