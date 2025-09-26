import { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WorldKidsNews {
  id: string;
  week_date: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

interface WorldKidsNewsCardProps {
  newsItem: WorldKidsNews;
  isPreview?: boolean;
}

export default function WorldKidsNewsCard({ newsItem, isPreview = false }: WorldKidsNewsCardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className="space-y-2">
      {/* Image Carousel */}
      <div className="relative">
        <Carousel className="w-full">
          <CarouselContent>
            {newsItem.image_urls.map((imageUrl, index) => (
              <CarouselItem key={index}>
                <div className="aspect-[4/3] relative overflow-hidden rounded-lg">
                  <img
                    src={imageUrl}
                    alt={`萬國小新聞 ${new Date(newsItem.week_date).toLocaleDateString('zh-TW')} - 圖片 ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {newsItem.image_urls.length > 1 && (
            <>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </>
          )}
        </Carousel>

        {/* Image Counter Badge */}
        {newsItem.image_urls.length > 1 && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-black/70 text-white"
          >
            {currentSlide + 1} / {newsItem.image_urls.length}
          </Badge>
        )}
      </div>

      {/* Dots Indicator for Multiple Images */}
      {newsItem.image_urls.length > 1 && (
        <div className="flex justify-center gap-1 pt-2">
          {newsItem.image_urls.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`前往第 ${index + 1} 張圖片`}
            />
          ))}
        </div>
      )}

      {!isPreview && (
        <div className="text-sm text-muted-foreground">
          共 {newsItem.image_urls.length} 張圖片
        </div>
      )}
    </div>
  );
}