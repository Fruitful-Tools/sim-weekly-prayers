import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import FamilyPrayerCard from '@/components/FamilyPrayerCard';
import SearchBox from '@/components/SearchBox';
import PrayerDialog from '@/components/PrayerDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
}

const FamilyPrayers = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [familyPrayers, setFamilyPrayers] = useState<FamilyPrayer[]>([]);
  const [filteredFamilyPrayers, setFilteredFamilyPrayers] = useState<
    FamilyPrayer[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const fetchFamilyPrayers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('world_kids_news')
        .select(
          `
          id,
          week_date,
          image_urls,
          prayer_id,
          world_kids_news_translations!inner(title, content, language)
        `
        )
        .eq('world_kids_news_translations.language', i18n.language)
        .not('image_urls', 'eq', '{}')
        .order('week_date', { ascending: false });

      if (error) throw error;

      setFamilyPrayers(data || []);
    } catch (error) {
      console.error('Error fetching family prayers:', error);
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  const filterFamilyPrayers = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredFamilyPrayers(familyPrayers);
      return;
    }

    const filtered = familyPrayers.filter((familyPrayer) => {
      const translation = familyPrayer.world_kids_news_translations?.[0];
      if (!translation) return false;

      const searchLower = searchQuery.toLowerCase();
      return (
        translation.title?.toLowerCase().includes(searchLower) ||
        false ||
        translation.content?.toLowerCase().includes(searchLower) ||
        false
      );
    });

    setFilteredFamilyPrayers(filtered);
  }, [familyPrayers, searchQuery]);

  useEffect(() => {
    fetchFamilyPrayers();
  }, [fetchFamilyPrayers]);

  useEffect(() => {
    filterFamilyPrayers();
  }, [filterFamilyPrayers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const formatFamilyPrayerForCard = (familyPrayer: FamilyPrayer) => ({
    id: familyPrayer.id,
    week_date: familyPrayer.week_date,
    image_urls: familyPrayer.image_urls,
    title: familyPrayer.world_kids_news_translations?.[0]?.title,
    content: familyPrayer.world_kids_news_translations?.[0]?.content,
  });

  const handleEditFamilyPrayer = async (prayerId: string) => {
    // Navigate to the prayer edit page if prayer_id exists
    const familyPrayer = familyPrayers.find((fp) => fp.id === prayerId);
    if (familyPrayer?.prayer_id) {
      window.location.href = `/prayers`;
      toast({
        title: t('prayer.error'),
        description: '請從禱告列表編輯關聯的禱告',
      });
    }
  };

  const handleDeleteFamilyPrayer = async (familyPrayerId: string) => {
    if (!window.confirm(t('prayer.confirmDelete'))) return;

    try {
      const { data: familyPrayer, error: fetchError } = await supabase
        .from('world_kids_news')
        .select('image_urls')
        .eq('id', familyPrayerId)
        .single();

      if (fetchError) throw fetchError;

      // Delete images from storage
      if (familyPrayer?.image_urls && familyPrayer.image_urls.length > 0) {
        const { deleteImageFromStorage } = await import('@/lib/storageUtils');
        for (const imageUrl of familyPrayer.image_urls) {
          await deleteImageFromStorage(imageUrl);
        }
      }

      // Delete the family prayer
      const { error } = await supabase
        .from('world_kids_news')
        .delete()
        .eq('id', familyPrayerId);

      if (error) throw error;

      toast({
        title: t('prayer.success'),
        description: t('prayer.deleted'),
      });

      fetchFamilyPrayers();
    } catch (error) {
      console.error('Error deleting family prayer:', error);
      toast({
        title: t('prayer.error'),
        description: t('prayer.deleteError'),
        variant: 'destructive',
      });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredFamilyPrayers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentFamilyPrayers = filteredFamilyPrayers.slice(
    startIndex,
    endIndex
  );

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('nav.familyPrayers')}
            </h1>
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
            {t(
              filteredFamilyPrayers.length === 1
                ? 'pagination.result'
                : 'pagination.results',
              {
                count: filteredFamilyPrayers.length,
                query: searchQuery,
              }
            )}
          </div>
        )}

        {/* Pagination Info */}
        {!searchQuery && filteredFamilyPrayers.length > 0 && (
          <div className="text-center text-sm text-muted-foreground mb-6">
            {t('pagination.showing', {
              start: startIndex + 1,
              end: Math.min(endIndex, filteredFamilyPrayers.length),
              total: filteredFamilyPrayers.length,
            })}
          </div>
        )}

        {/* Family Prayers Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            {t('prayer.loading')}
          </div>
        ) : filteredFamilyPrayers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentFamilyPrayers.map((familyPrayer) => (
                <div key={familyPrayer.id} className="relative group">
                  <FamilyPrayerCard
                    familyPrayer={formatFamilyPrayerForCard(familyPrayer)}
                    isPreview
                  />
                  {user && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDeleteFamilyPrayer(familyPrayer.id)
                          }
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={
                          currentPage === 1
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>

                    {generatePageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page as number);
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            setCurrentPage(currentPage + 1);
                        }}
                        className={
                          currentPage === totalPages
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            {t('prayer.noResults')}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyPrayers;
