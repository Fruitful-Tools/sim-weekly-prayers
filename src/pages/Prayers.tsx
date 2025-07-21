import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import PrayerCard from '@/components/PrayerCard';
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const fetchPrayers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select(
          `
          id,
          week_date,
          image_url,
          prayer_translations(title, content, language)
        `
        )
        .order('week_date', { ascending: false });

      if (error) throw error;

      // Filter and format prayers for current language
      const formattedPrayers =
        data
          ?.map((prayer) => ({
            ...prayer,
            prayer_translations: prayer.prayer_translations.filter(
              (t) => t.language === i18n.language
            ),
          }))
          .filter((prayer) => prayer.prayer_translations.length > 0) || [];

      setPrayers(formattedPrayers);
    } catch (error) {
      console.error('Error fetching prayers:', error);
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  const filterPrayers = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredPrayers(prayers);
      return;
    }

    const filtered = prayers.filter((prayer) => {
      const translation = prayer.prayer_translations[0];
      if (!translation) return false;

      const searchLower = searchQuery.toLowerCase();
      return (
        translation.title.toLowerCase().includes(searchLower) ||
        translation.content.toLowerCase().includes(searchLower)
      );
    });

    setFilteredPrayers(filtered);
  }, [prayers, searchQuery]);

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  useEffect(() => {
    filterPrayers();
  }, [filterPrayers]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery]);

  const formatPrayerForCard = (prayer: Prayer) => ({
    id: prayer.id,
    week_date: prayer.week_date,
    image_url: prayer.image_url,
    title: prayer.prayer_translations[0]?.title || '',
    content: prayer.prayer_translations[0]?.content || '',
  });

  const handleCreatePrayer = () => {
    setEditingPrayer(null);
    setDialogOpen(true);
  };

  const handleEditPrayer = async (prayerId: string) => {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select(
          `
          id,
          week_date,
          image_url,
          prayer_translations(title, content, language)
        `
        )
        .eq('id', prayerId)
        .single();

      if (error) throw error;

      setEditingPrayer({
        ...data,
        translations: data.prayer_translations,
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
      // First get the prayer to get its image URL
      const { data: prayer, error: fetchError } = await supabase
        .from('prayers')
        .select('image_url')
        .eq('id', prayerId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the prayer (this will cascade delete translations)
      const { error } = await supabase
        .from('prayers')
        .delete()
        .eq('id', prayerId);

      if (error) throw error;

      // Delete the image from storage if it exists
      if (prayer?.image_url) {
        console.log('Attempting to delete image:', prayer.image_url);
        const { deleteImageFromStorage } = await import('@/lib/storageUtils');
        const deleteResult = await deleteImageFromStorage(prayer.image_url);
        console.log('Image deletion result:', deleteResult);
      }

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

  // Pagination logic
  const totalPages = Math.ceil(filteredPrayers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPrayers = filteredPrayers.slice(startIndex, endIndex);

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
            {t(
              filteredPrayers.length === 1
                ? 'pagination.result'
                : 'pagination.results',
              {
                count: filteredPrayers.length,
                query: searchQuery,
              }
            )}
          </div>
        )}

        {/* Pagination Info */}
        {!searchQuery && filteredPrayers.length > 0 && (
          <div className="text-center text-sm text-muted-foreground mb-6">
            {t('pagination.showing', {
              start: startIndex + 1,
              end: Math.min(endIndex, filteredPrayers.length),
              total: filteredPrayers.length,
            })}
          </div>
        )}

        {/* Prayers Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            {t('prayer.loading')}
          </div>
        ) : filteredPrayers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPrayers.map((prayer) => (
                <div key={prayer.id} className="relative group">
                  <PrayerCard prayer={formatPrayerForCard(prayer)} isPreview />
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
