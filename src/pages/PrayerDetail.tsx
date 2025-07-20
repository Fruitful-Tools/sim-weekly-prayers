import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Share2, Copy, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

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
  const { date, id } = useParams<{ date?: string; id?: string }>();
  const { t, i18n } = useTranslation();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (date || id) {
      fetchPrayer();
    }
  }, [date, id, i18n.language]);

  const formatUrlDateToDbDate = (urlDate: string) => {
    // Convert "20240115" to "2024-01-15"
    if (urlDate && urlDate.length === 8) {
      return `${urlDate.slice(0, 4)}-${urlDate.slice(4, 6)}-${urlDate.slice(6, 8)}`;
    }
    return urlDate; // fallback for existing format
  };

  const fetchPrayer = async () => {
    try {
      console.log('Fetching prayer for date:', date, 'or id:', id);
      
      let query = supabase
        .from('prayers')
        .select(`
          id,
          week_date,
          image_url,
          prayer_translations!inner(title, content)
        `)
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
      if (data && (!data.prayer_translations || data.prayer_translations.length === 0)) {
        console.warn('No translations found for prayer');
        setPrayer(null);
      } else {
        setPrayer(data);
      }
    } catch (error) {
      console.error('Error fetching prayer:', error);
      setPrayer(null);
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

  const formatDateForUrl = (dateString: string) => {
    return dateString.replace(/-/g, '');
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/prayer/${formatDateForUrl(prayer?.week_date || '')}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t('prayer.linkCopied'),
        description: t('prayer.linkCopiedDesc'),
      });
    } catch (err) {
      toast({
        title: t('prayer.copyFailed'),
        description: t('prayer.copyFailedDesc'),
        variant: "destructive",
      });
    }
  };

  const handleShareFacebook = () => {
    const url = `${window.location.origin}/prayer/${formatDateForUrl(prayer?.week_date || '')}`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
  };

  const handleShareTwitter = () => {
    const url = `${window.location.origin}/prayer/${formatDateForUrl(prayer?.week_date || '')}`;
    const text = prayer?.prayer_translations?.[0]?.title || 'Prayer';
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
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

  // Safely extract translation and ensure all values are strings
  const translation = prayer?.prayer_translations?.[0];
  const safeTitle = String((translation?.title && typeof translation.title === 'string') ? translation.title : 'Prayer');
  const rawContent = String((translation?.content && typeof translation.content === 'string') ? translation.content : 'Weekly Prayer');
  
  // Sanitize content for meta descriptions - remove newlines and limit length
  const safeContent = String(rawContent)
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u4e00-\u9fff]/g, '') // Remove special characters except Chinese characters
    .trim()
    .substring(0, 160);
  
  const safeImageUrl = String((prayer?.image_url && typeof prayer.image_url === 'string') ? prayer.image_url : '');
  const currentUrl = String(`${window.location.origin}/prayer/${formatDateForUrl(prayer?.week_date || '')}`);

  console.log('Prayer data:', {
    prayer,
    translation,
    safeTitle,
    safeContent,
    safeImageUrl
  });

  return (
    <>
      <Helmet>
        <title>{safeTitle}</title>
        <meta name="description" content={safeContent.substring(0, 160)} />
        <meta property="og:title" content={safeTitle} />
        <meta property="og:description" content={safeContent.substring(0, 160)} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="article" />
        {safeImageUrl && (
          <>
            <meta property="og:image" content={safeImageUrl} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
          </>
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={safeTitle} />
        <meta name="twitter:description" content={safeContent.substring(0, 160)} />
        {safeImageUrl && <meta name="twitter:image" content={safeImageUrl} />}
      </Helmet>
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
            {safeImageUrl && (
              <div className="mb-8 overflow-hidden rounded-lg shadow-prayer">
                <img 
                  src={safeImageUrl} 
                  alt={safeTitle}
                  className="w-full h-auto object-contain"
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
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      {t('prayer.copyLink')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareFacebook}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareTwitter}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Twitter
                    </Button>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 leading-tight">
                  {safeTitle}
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
                     {rawContent}
                   </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrayerDetail;