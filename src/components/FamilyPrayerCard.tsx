import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FamilyPrayer {
  id: string;
  week_date: string;
  image_urls: string[];
  title?: string;
  content?: string;
}

interface FamilyPrayerCardProps {
  familyPrayer: FamilyPrayer;
  isPreview?: boolean;
}

const FamilyPrayerCard = ({
  familyPrayer,
  isPreview = false,
}: FamilyPrayerCardProps) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPreviewContent = (content: string) => {
    const plainText = content.replace(/[#*`]/g, '').replace(/\n/g, ' ');
    return plainText.length > 150
      ? plainText.substring(0, 150) + '...'
      : plainText;
  };

  const formatDateForUrl = (dateString: string) => {
    return dateString.replace(/-/g, '');
  };

  const firstImageUrl = familyPrayer.image_urls?.[0];

  return (
    <Link
      to={`/family-prayer/${formatDateForUrl(familyPrayer.week_date)}`}
      className="block h-full"
    >
      <Card className="group h-full overflow-hidden bg-gradient-to-br from-card to-card/80 border-border hover:shadow-prayer transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        {firstImageUrl && (
          <div className="overflow-hidden aspect-video">
            <img
              src={firstImageUrl}
              alt={familyPrayer.title || t('nav.familyPrayers')}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(familyPrayer.week_date)}
          </div>
          {familyPrayer.title && (
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {familyPrayer.title}
            </h3>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {isPreview && familyPrayer.content && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {getPreviewContent(familyPrayer.content)}
            </p>
          )}

          <div className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center text-sm font-medium">
            {t('prayer.readMore')}
            <ChevronRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default FamilyPrayerCard;
