import { useTranslation } from 'react-i18next';

interface WorldKidsNewsData {
  id: string;
  image_urls: string[];
  world_kids_news_translations?: {
    title?: string;
    content?: string;
    language: string;
  }[];
}

interface WorldKidsNewsSlidesProps {
  worldKidsNews: WorldKidsNewsData;
}

export default function WorldKidsNewsSlides({ worldKidsNews }: WorldKidsNewsSlidesProps) {
  const { i18n } = useTranslation();

  const currentTranslation = worldKidsNews.world_kids_news_translations?.find(
    (t) => t.language === i18n.language
  );

  if (!worldKidsNews.image_urls || worldKidsNews.image_urls.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Title and Content */}
      {currentTranslation && (currentTranslation.title || currentTranslation.content) && (
        <div className="space-y-3 text-center">
          {currentTranslation.title && (
            <h3 className="text-2xl font-bold">{currentTranslation.title}</h3>
          )}
          {currentTranslation.content && (
            <p className="text-muted-foreground text-lg leading-relaxed">{currentTranslation.content}</p>
          )}
        </div>
      )}

      {/* Images - Vertically Stacked */}
      <div className="space-y-4">
        {worldKidsNews.image_urls.map((url, index) => (
          <div key={index} className="w-full">
            <img
              src={url}
              alt={`萬國小新聞 圖片 ${index + 1}`}
              className="w-full h-auto object-contain rounded-lg shadow-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}