import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import PrayerCard from '@/components/PrayerCard';
import WorldKidsNewsCard from '@/components/WorldKidsNewsCard';
import { ArrowRight, Globe2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  week_date: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

const Home = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [latestPrayers, setLatestPrayers] = useState<Prayer[]>([]);
  const [latestWorldKidsNews, setLatestWorldKidsNews] = useState<WorldKidsNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);

  const fetchLatestPrayers = useCallback(async () => {
    try {
      const limit = 3; // Always show 3 latest prayers for preview
      const { data, error } = await supabase
        .from('prayers')
        .select(
          `
          id,
          week_date,
          image_url,
          prayer_translations!inner(title, content)
        `
        )
        .eq('prayer_translations.language', i18n.language)
        .order('week_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLatestPrayers(data || []);
    } catch (error) {
      console.error('Error fetching prayers:', error);
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  const fetchLatestWorldKidsNews = useCallback(async () => {
    try {
      const limit = 3; // Always show 3 latest world kids news for preview
      const { data, error } = await supabase
        .from('world_kids_news')
        .select('*')
        .order('week_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLatestWorldKidsNews(data || []);
    } catch (error) {
      console.error('Error fetching world kids news:', error);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestPrayers();
    fetchLatestWorldKidsNews();
  }, [fetchLatestPrayers, fetchLatestWorldKidsNews]);

  const formatPrayerForCard = (prayer: Prayer) => ({
    id: prayer.id,
    week_date: prayer.week_date,
    image_url: prayer.image_url,
    title: prayer.prayer_translations[0]?.title || '',
    content: prayer.prayer_translations[0]?.content || '',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <Globe2 className="h-16 w-16 mx-auto text-primary mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-4">
              {t('home.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('home.subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/prayers">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-prayer transition-all duration-300"
              >
                {t('home.viewAllPrayers')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/world-kids-news">
              <Button
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                查看所有萬國小新聞
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Prayers Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('home.latestPrayer')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-primary-glow mx-auto"></div>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground">
              {t('prayer.loading')}
            </div>
          ) : latestPrayers.length > 0 ? (
            <>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {latestPrayers.map((prayer) => (
                  <PrayerCard
                    key={prayer.id}
                    prayer={formatPrayerForCard(prayer)}
                    isPreview
                  />
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/prayers">
                  <Button variant="outline" size="lg">
                    查看所有禱告
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              {t('prayer.noResults')}
            </div>
          )}
        </div>
      </section>

      {/* Latest World Kids News Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('home.latestWorldKidsNews')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-primary-glow mx-auto"></div>
          </div>

          {newsLoading ? (
            <div className="text-center text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : latestWorldKidsNews.length > 0 ? (
            <>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {latestWorldKidsNews.map((newsItem) => (
                  <WorldKidsNewsCard key={newsItem.id} newsItem={newsItem} />
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/world-kids-news">
                  <Button variant="outline" size="lg">
                    查看所有萬國小新聞
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              尚無萬國小新聞內容
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
