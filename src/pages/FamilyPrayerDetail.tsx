import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import WorldKidsNewsSlides from '@/components/WorldKidsNewsSlides';
import SocialShareDropdown from '@/components/SocialShareDropdown';

interface FamilyPrayer {
  id: string;
  week_date: string;
  image_urls: string[];
  world_kids_news_translations?: {
    title?: string;
    content?: string;
    language: string;
  }[];
}

const FamilyPrayerDetail = () => {
  const { date, id } = useParams<{ date?: string; id?: string }>();
  const { t, i18n } = useTranslation();
  const [familyPrayer, setFamilyPrayer] = useState<FamilyPrayer | null>(null);
  const [loading, setLoading] = useState(true);

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
          world_kids_news_translations!inner(title, content, language)
        `
        )
        .eq('world_kids_news_translations.language', i18n.language);

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
        (!data.world_kids_news_translations || data.world_kids_news_translations.length === 0)
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
          <WorldKidsNewsSlides worldKidsNews={familyPrayer} />
        </div>
      </div>
    </div>
  );
};

export default FamilyPrayerDetail;
