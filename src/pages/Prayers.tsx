import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import PrayerCard from '@/components/PrayerCard';
import SearchBox from '@/components/SearchBox';

interface Prayer {
  id: string;
  week_date: string;
  image_url?: string;
  prayer_translations: {
    title: string;
    content: string;
  }[];
}

const Prayers = () => {
  const { t, i18n } = useTranslation();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [filteredPrayers, setFilteredPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPrayers();
  }, [i18n.language]);

  useEffect(() => {
    filterPrayers();
  }, [prayers, searchQuery]);

  const fetchPrayers = async () => {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select(`
          id,
          week_date,
          image_url,
          prayer_translations!inner(title, content)
        `)
        .eq('prayer_translations.language', i18n.language)
        .order('week_date', { ascending: false });

      if (error) throw error;
      setPrayers(data || []);
    } catch (error) {
      console.error('Error fetching prayers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrayers = () => {
    if (!searchQuery.trim()) {
      setFilteredPrayers(prayers);
      return;
    }

    const filtered = prayers.filter(prayer => {
      const translation = prayer.prayer_translations[0];
      if (!translation) return false;
      
      const searchLower = searchQuery.toLowerCase();
      return translation.title.toLowerCase().includes(searchLower) ||
             translation.content.toLowerCase().includes(searchLower);
    });
    
    setFilteredPrayers(filtered);
  };

  const formatPrayerForCard = (prayer: Prayer) => ({
    id: prayer.id,
    week_date: prayer.week_date,
    image_url: prayer.image_url,
    title: prayer.prayer_translations[0]?.title || '',
    content: prayer.prayer_translations[0]?.content || ''
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('nav.prayers')}
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-primary-glow mx-auto mb-8"></div>
          
          {/* Search */}
          <div className="flex justify-center">
            <SearchBox onSearch={setSearchQuery} />
          </div>
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="text-center text-sm text-muted-foreground mb-6">
            {filteredPrayers.length} {filteredPrayers.length === 1 ? 'result' : 'results'} for "{searchQuery}"
          </div>
        )}

        {/* Prayers Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            {t('prayer.loading')}
          </div>
        ) : filteredPrayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrayers.map((prayer) => (
              <PrayerCard 
                key={prayer.id} 
                prayer={formatPrayerForCard(prayer)} 
                isPreview 
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            {t('prayer.noResults')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Prayers;