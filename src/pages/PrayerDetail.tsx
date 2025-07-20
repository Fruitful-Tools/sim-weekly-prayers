import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar } from 'lucide-react';

interface Prayer {
  id: string;
  week_date: string;
  image_url?: string;
  prayer_translations: {
    title: string;
    content: string;
  }[];
}

const PrayerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPrayer();
    }
  }, [id, i18n.language]);

  const fetchPrayer = async () => {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select(`
          id,
          week_date,
          image_url,
          prayer_translations!inner(title, content)
        `)
        .eq('id', id)
        .eq('prayer_translations.language', i18n.language)
        .single();

      if (error) throw error;
      setPrayer(data);
    } catch (error) {
      console.error('Error fetching prayer:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'zh-TW' ? 'zh-TW' : 'en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
          <div className="text-muted-foreground mb-4">{t('prayer.noResults')}</div>
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

  const translation = prayer.prayer_translations[0];

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
          {prayer.image_url && (
            <div className="aspect-video mb-8 overflow-hidden rounded-lg shadow-prayer">
              <img 
                src={prayer.image_url} 
                alt={translation.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <Card className="bg-gradient-to-br from-card to-card/80 border-border shadow-prayer">
            <CardContent className="p-8">
              {/* Date */}
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(prayer.week_date)}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 leading-tight">
                {translation.title}
              </h1>

              {/* Content */}
              <div className="prose prose-lg max-w-none text-foreground">
                <ReactMarkdown 
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mt-8 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-medium text-foreground mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="text-foreground mb-4 leading-relaxed">{children}</p>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-foreground space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-foreground space-y-1">{children}</ol>,
                  }}
                >
                  {translation.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrayerDetail;