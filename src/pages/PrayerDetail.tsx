import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar } from 'lucide-react';
import SocialShareDropdown from '@/components/SocialShareDropdown';
import WorldKidsNewsSlides from '@/components/WorldKidsNewsSlides';

interface Prayer {
  id: string;
  week_date: string;
  image_url?: string;
  prayer_translations: {
    title: string;
    content: string;
  }[];
}

interface WorldKidsNews {
  id: string;
  image_urls: string[];
  world_kids_news_translations?: {
    title?: string;
    content?: string;
    language: string;
  }[];
}

const PrayerDetail = () => {
  const { date, id } = useParams<{ date?: string; id?: string }>();
  const { t, i18n } = useTranslation();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [worldKidsNews, setWorldKidsNews] = useState<WorldKidsNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWorldKidsNews, setShowWorldKidsNews] = useState(false);

  const formatUrlDateToDbDate = (urlDate: string) => {
    // Convert "20240115" to "2024-01-15"
    if (urlDate && urlDate.length === 8) {
      return `${urlDate.slice(0, 4)}-${urlDate.slice(4, 6)}-${urlDate.slice(6, 8)}`;
    }
    return urlDate; // fallback for existing format
  };

  const fetchPrayer = useCallback(async () => {
    try {
      console.log('Fetching prayer for date:', date, 'or id:', id);

      let query = supabase
        .from('prayers')
        .select(
          `
          id,
          week_date,
          image_url,
          prayer_translations!inner(title, content, language),
          world_kids_news(
            id,
            image_urls,
            world_kids_news_translations(title, content, language)
          )
        `
        )
        .eq('prayer_translations.language', i18n.language);

      if (date) {
        const formattedDate = formatUrlDateToDbDate(date);
        console.log('Formatted date for query:', formattedDate);
        query = query.eq('week_date', formattedDate);
      } else if (id) {
        query = query.eq('id', id);
      }

      const { data, error } = await query.single();

      console.log('Query result:', { data, error });

      if (error) throw error;

      // Validate the data structure
      if (
        data &&
        (!data.prayer_translations || data.prayer_translations.length === 0)
      ) {
        console.warn('No translations found for prayer');
        setPrayer(null);
      } else {
        setPrayer(data);
        
        // Set world kids news if it exists
        if (data?.world_kids_news && data.world_kids_news.length > 0) {
          setWorldKidsNews(data.world_kids_news[0]);
        } else {
          setWorldKidsNews(null);
        }
      }
    } catch (error) {
      console.error('Error fetching prayer:', error);
      setPrayer(null);
    } finally {
      setLoading(false);
    }
  }, [date, id, i18n.language]);

  useEffect(() => {
    if (date || id) {
      fetchPrayer();
    }
  }, [date, id, fetchPrayer]);

  // Check if world kids news exists and has images
  const hasWorldKidsNews = Boolean(worldKidsNews?.image_urls?.length > 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      i18n.language === 'zh-TW' ? 'zh-TW' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  const formatDateForUrl = (dateString: string) => {
    return dateString.replace(/-/g, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center">
        <div className="text-muted-foreground">{t('prayer.loading')}</div>
      </div>
    );
  }

  if (!prayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">
            {t('prayer.noResults')}
          </div>
          <Link to="/prayers">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('prayer.backToList')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Safely extract translation and ensure all values are strings
  const translation = prayer?.prayer_translations?.[0];
  const safeTitle = String(translation?.title || 'Prayer');
  const rawContent = String(translation?.content || 'Weekly Prayer');
  const safeImageUrl = String(prayer?.image_url || '');
  const currentUrl = `${window.location.origin}/prayer/${formatDateForUrl(String(prayer?.week_date || ''))}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/prayers">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('prayer.backToList')}
            </Button>
          </Link>
        </div>

          {/* Prayer Content */}
          <div className="max-w-4xl mx-auto">
            {/* Toggle for World Kids News - Only show if world kids news exists */}
            {hasWorldKidsNews && (
              <div className="mb-6 flex items-center justify-center space-x-4">
                <Label htmlFor="world-kids-news-toggle" className="text-sm font-medium">
                  {showWorldKidsNews ? t('prayer.switchToPrayer') : t('prayer.switchToWorldKidsNews')}
                </Label>
                <Switch
                  id="world-kids-news-toggle"
                  checked={showWorldKidsNews}
                  onCheckedChange={setShowWorldKidsNews}
                />
              </div>
            )}

            {showWorldKidsNews && hasWorldKidsNews ? (
              /* World Kids News View */
              <div>
                <WorldKidsNewsSlides worldKidsNews={worldKidsNews!} />
              </div>
            ) : (
              /* Prayer View */
              <>
                {safeImageUrl && (
                  <div className="mb-8 overflow-hidden rounded-lg shadow-prayer">
                    <img
                      src={safeImageUrl}
                      alt={safeTitle}
                      className="w-full h-auto object-contain md:max-h-[400px]"
                    />
                  </div>
                )}

                <Card className="bg-gradient-to-br from-card to-card/80 border-border shadow-prayer">
                  <CardContent className="p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(prayer.week_date)}
                      </div>

                      <SocialShareDropdown url={currentUrl} title={safeTitle} />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 leading-tight">
                      {safeTitle}
                    </h1>

                    {/* Content */}
                    <div className="prose prose-lg max-w-none text-foreground">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold text-foreground mt-8 mb-4">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-foreground mb-4 leading-relaxed">
                              {children}
                            </p>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
                              {children}
                            </blockquote>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-4 text-foreground space-y-1">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-4 text-foreground space-y-1">
                              {children}
                            </ol>
                          ),
                        }}
                      >
                        {rawContent}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
      </div>
    </div>
  );
};

export default PrayerDetail;
