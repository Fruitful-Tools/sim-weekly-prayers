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
import WorldKidsNewsSlides from '@/components/WorldKidsNewsSlides';
import SocialShareDropdown from '@/components/SocialShareDropdown';

interface FamilyPrayer {
  id: string;
  week_date: string;
  image_urls: string[];
  prayer_id?: string;
  world_kids_news_translations?: {
    title?: string;
    content?: string;
    language: string;
  }[];
  prayers?: {
    id: string;
    week_date: string;
    image_url?: string;
    prayer_translations: {
      title: string;
      content: string;
    }[];
  };
}

const FamilyPrayerDetail = () => {
  const { date, id } = useParams<{ date?: string; id?: string }>();
  const { t, i18n } = useTranslation();
  const [familyPrayer, setFamilyPrayer] = useState<FamilyPrayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFamilyPrayer, setShowFamilyPrayer] = useState(true);

  const formatUrlDateToDbDate = (urlDate: string) => {
    if (urlDate && urlDate.length === 8) {
      return `${urlDate.slice(0, 4)}-${urlDate.slice(4, 6)}-${urlDate.slice(6, 8)}`;
    }
    return urlDate;
  };

  const fetchFamilyPrayer = useCallback(async () => {
    try {
      let query = supabase
        .from('world_kids_news')
        .select(
          `
          id,
          week_date,
          image_urls,
          prayer_id,
          world_kids_news_translations!inner(title, content, language),
          prayers(
            id,
            week_date,
            image_url,
            prayer_translations!inner(title, content, language)
          )
        `
        )
        .eq('world_kids_news_translations.language', i18n.language)
        .eq('prayers.prayer_translations.language', i18n.language);

      if (date) {
        const formattedDate = formatUrlDateToDbDate(date);
        query = query.eq('week_date', formattedDate);
      } else if (id) {
        query = query.eq('id', id);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      if (
        data &&
        (!data.world_kids_news_translations ||
          data.world_kids_news_translations.length === 0)
      ) {
        console.warn('No translations found for family prayer');
        setFamilyPrayer(null);
      } else {
        setFamilyPrayer(data);
      }
    } catch (error) {
      console.error('Error fetching family prayer:', error);
      setFamilyPrayer(null);
    } finally {
      setLoading(false);
    }
  }, [date, id, i18n.language]);

  useEffect(() => {
    if (date || id) {
      fetchFamilyPrayer();
    }
  }, [date, id, fetchFamilyPrayer]);

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

  // Check if corresponding prayer exists
  const hasCorrespondingPrayer = Boolean(
    familyPrayer?.prayers?.prayer_translations &&
      familyPrayer.prayers.prayer_translations.length > 0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center">
        <div className="text-muted-foreground">{t('prayer.loading')}</div>
      </div>
    );
  }

  if (!familyPrayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">
            {t('prayer.noResults')}
          </div>
          <Link to="/family-prayers">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('prayer.backToList')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentUrl = `${window.location.origin}/family-prayer/${formatDateForUrl(String(familyPrayer?.week_date || ''))}`;
  const translation = familyPrayer.world_kids_news_translations?.[0];
  const safeTitle = String(translation?.title || t('nav.familyPrayers'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/family-prayers">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('prayer.backToList')}
            </Button>
          </Link>

          <SocialShareDropdown url={currentUrl} title={safeTitle} />
        </div>

        {/* Family Prayer Content */}
        <div className="max-w-4xl mx-auto">
          {/* Toggle for Prayer - Only show if corresponding prayer exists */}
          {hasCorrespondingPrayer && (
            <div className="mb-6 flex items-center justify-center space-x-4">
              <Label htmlFor="prayer-toggle" className="text-sm font-medium">
                {showFamilyPrayer
                  ? t('prayer.switchToPrayer')
                  : t('prayer.switchToFamilyPrayer')}
              </Label>
              <Switch
                id="prayer-toggle"
                checked={showFamilyPrayer}
                onCheckedChange={setShowFamilyPrayer}
              />
            </div>
          )}

          {showFamilyPrayer ? (
            /* Family Prayer View */
            <WorldKidsNewsSlides worldKidsNews={familyPrayer} />
          ) : (
            /* Prayer View */
            <>
              {familyPrayer.prayers?.image_url && (
                <div className="mb-8 overflow-hidden rounded-lg shadow-prayer">
                  <img
                    src={familyPrayer.prayers.image_url}
                    alt={familyPrayer.prayers.prayer_translations[0]?.title}
                    className="w-full h-auto object-contain md:max-h-[400px]"
                  />
                </div>
              )}

              <Card className="bg-gradient-to-br from-card to-card/80 border-border shadow-prayer">
                <CardContent className="p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(
                        familyPrayer.prayers?.week_date ||
                          familyPrayer.week_date
                      )}
                    </div>

                    <SocialShareDropdown
                      url={currentUrl}
                      title={
                        familyPrayer.prayers?.prayer_translations[0]?.title ||
                        ''
                      }
                    />
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 leading-tight">
                    {familyPrayer.prayers?.prayer_translations[0]?.title}
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
                      {familyPrayer.prayers?.prayer_translations[0]?.content ||
                        ''}
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

export default FamilyPrayerDetail;
