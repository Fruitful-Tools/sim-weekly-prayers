import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import PrayerCard from '@/components/PrayerCard';
import SearchBox from '@/components/SearchBox';
import PrayerDialog from '@/components/PrayerDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Prayer {
  id: string;
  week_date: string;
  image_url?: string;
  prayer_translations: {
    title: string;
    content: string;
    language: string;
  }[];
  translations?: {
    title: string;
    content: string;
    language: string;
  }[];
}

const Prayers = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [filteredPrayers, setFilteredPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);

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
          prayer_translations(title, content, language)
        `)
        .order('week_date', { ascending: false });

      if (error) throw error;
      
      // Filter and format prayers for current language
      const formattedPrayers = data?.map(prayer => ({
        ...prayer,
        prayer_translations: prayer.prayer_translations.filter(
          (t: any) => t.language === i18n.language
        )
      })).filter(prayer => prayer.prayer_translations.length > 0) || [];
      
      setPrayers(formattedPrayers);
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

  const handleCreatePrayer = () => {
    setEditingPrayer(null);
    setDialogOpen(true);
  };

  const handleEditPrayer = async (prayerId: string) => {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select(`
          id,
          week_date,
          image_url,
          prayer_translations(title, content, language)
        `)
        .eq('id', prayerId)
        .single();

      if (error) throw error;

      setEditingPrayer({
        ...data,
        translations: data.prayer_translations
      });
      setDialogOpen(true);
    } catch (error) {
      console.error('Error fetching prayer for edit:', error);
      toast({
        title: t('prayer.error'),
        description: t('prayer.fetchError'),
        variant: 'destructive',
      });
    }
  };

  const handleDeletePrayer = async (prayerId: string) => {
    if (!window.confirm(t('prayer.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('prayers')
        .delete()
        .eq('id', prayerId);

      if (error) throw error;

      toast({
        title: t('prayer.success'),
        description: t('prayer.deleted'),
      });

      fetchPrayers();
    } catch (error) {
      console.error('Error deleting prayer:', error);
      toast({
        title: t('prayer.error'),
        description: t('prayer.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const handleDialogSuccess = () => {
    fetchPrayers();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('nav.prayers')}
            </h1>
            {user && (
              <Button onClick={handleCreatePrayer} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('prayer.createPrayer')}
              </Button>
            )}
          </div>
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
              <div key={prayer.id} className="relative group">
                <PrayerCard 
                  prayer={formatPrayerForCard(prayer)} 
                  isPreview 
                />
                {user && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditPrayer(prayer.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePrayer(prayer.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            {t('prayer.noResults')}
          </div>
        )}

        {/* Prayer Dialog */}
        <PrayerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          prayer={editingPrayer}
          onSuccess={handleDialogSuccess}
        />
      </div>
    </div>
  );
};

export default Prayers;