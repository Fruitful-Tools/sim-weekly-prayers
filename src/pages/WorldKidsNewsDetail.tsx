import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorldKidsNews {
  id: string;
  week_date: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export default function WorldKidsNewsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<WorldKidsNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('world_kids_news')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setNews(data);
      } catch (error) {
        console.error('Error fetching world kids news:', error);
        toast.error('無法載入萬國小新聞');
        navigate('/world-kids-news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [id, navigate]);

  const nextImage = () => {
    if (news && currentImageIndex < news.image_urls.length - 1) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">載入中...</div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">找不到此新聞</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/world-kids-news')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {new Date(news.week_date).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h1>
              <p className="text-muted-foreground">萬國小新聞 - 禱告大冒險</p>
            </div>
          </div>

          {/* Image Carousel */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-muted">
                <img
                  src={news.image_urls[currentImageIndex]}
                  alt={`萬國小新聞 圖片 ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                
                {/* Navigation Arrows */}
                {news.image_urls.length > 1 && (
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
                      disabled={currentImageIndex === news.image_urls.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {news.image_urls.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail Navigation */}
          {news.image_urls.length > 1 && (
            <div className="flex justify-center gap-2">
              {news.image_urls.map((url, index) => (
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
      </div>
    </div>
  );
}