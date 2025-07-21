import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const isChineseLanguage = i18n.language === 'zh-TW';

  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-muted-foreground space-y-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs leading-relaxed">
              {t('home.footerMotto')}
            </p>
          </div>
          <div className="mb-2">
            © 2025{' '}
            <a
              href="https://home.fruitful-tools.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
            >
              多果數位
              <ExternalLink className="h-3 w-3" />
            </a>
            {isChineseLanguage
              ? '．為數位世界精心製作'
              : '. Crafted with care for the digital world.'}
          </div>
          <div className="text-xs">
            <a
              href="https://simtaiwan.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              SIM home
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
