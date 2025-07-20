import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import { Link } from 'react-router-dom';

interface Prayer {
  id: string;
  week_date: string;
  image_url?: string;
  title: string;
  content: string;
}

interface PrayerCardProps {
  prayer: Prayer;
  isPreview?: boolean;
}

const PrayerCard = ({ prayer, isPreview = false }: PrayerCardProps) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPreviewContent = (content: string) => {
    const plainText = content.replace(/[#*`]/g, '').replace(/\n/g, ' ');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  return (
    <Card className="group h-full overflow-hidden bg-gradient-to-br from-card to-card/80 border-border hover:shadow-prayer transition-all duration-300 hover:-translate-y-1">
      {prayer.image_url && (
        <div className="aspect-video overflow-hidden">
          <img 
            src={prayer.image_url} 
            alt={prayer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(prayer.week_date)}
        </div>
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {prayer.title}
        </h3>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isPreview && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {getPreviewContent(prayer.content)}
          </p>
        )}
        
        <Link to={`/prayer/${prayer.id}`}>
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            {t('prayer.readMore')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default PrayerCard;