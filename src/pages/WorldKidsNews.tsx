import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import WorldKidsNewsDialog from '@/components/WorldKidsNewsDialog';
import WorldKidsNewsCard from '@/components/WorldKidsNewsCard';
import { deleteImagesFromStorage } from '@/lib/storageUtils';
import { toast } from 'sonner';

interface WorldKidsNews {
  id: string;
  week_date: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export default function WorldKidsNews() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [news, setNews] = useState<WorldKidsNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<WorldKidsNews | null>(null);
  const [deletingNews, setDeletingNews] = useState<WorldKidsNews | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchNews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('world_kids_news')
        .select('*')
        .order('week_date', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error fetching world kids news:', error);
      toast.error('無法載入萬國小新聞');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const filterNews = (items: WorldKidsNews[]) => {
    if (!searchQuery.trim()) return items;
    return items.filter((item) =>
      new Date(item.week_date).toLocaleDateString('zh-TW').includes(searchQuery)
    );
  };

  const filteredNews = filterNews(news);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const currentNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateNews = () => {
    setEditingNews(null);
    setIsDialogOpen(true);
  };

  const handleEditNews = (newsItem: WorldKidsNews) => {
    setEditingNews(newsItem);
    setIsDialogOpen(true);
  };

  const handleDeleteNews = async (newsItem: WorldKidsNews) => {
    try {
      // Delete images from storage
      if (newsItem.image_urls.length > 0) {
        await deleteImagesFromStorage(newsItem.image_urls);
      }

      // Delete news from database
      const { error } = await supabase
        .from('world_kids_news')
        .delete()
        .eq('id', newsItem.id);

      if (error) throw error;

      toast.success('萬國小新聞已刪除');
      fetchNews();
    } catch (error) {
      console.error('Error deleting world kids news:', error);
      toast.error('刪除失敗');
    } finally {
      setDeletingNews(null);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingNews(null);
    fetchNews();
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">萬國小新聞</h1>
              <p className="text-muted-foreground mt-1">
                禱告大冒險 - 幫助家庭與孩子參與代禱
              </p>
            </div>
            {user && (
              <Button onClick={handleCreateNews} className="w-fit">
                <Plus className="mr-2 h-4 w-4" />
                新增小新聞
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜尋日期..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* News Grid */}
          {currentNews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">找不到萬國小新聞內容</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentNews.map((newsItem) => (
                <Card key={newsItem.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {new Date(newsItem.week_date).toLocaleDateString('zh-TW', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </CardTitle>
                      {user && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNews(newsItem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingNews(newsItem)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <WorldKidsNewsCard newsItem={newsItem} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                上一頁
              </Button>
              <span className="px-4 py-2">
                第 {currentPage} 頁，共 {totalPages} 頁
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                下一頁
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <WorldKidsNewsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleDialogClose}
        news={editingNews}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingNews} onOpenChange={() => setDeletingNews(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除這則萬國小新聞嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingNews && handleDeleteNews(deletingNews)}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}