import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { siGithub } from 'simple-icons';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const isChineseLanguage = i18n.language === 'zh-TW';

  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-muted-foreground space-y-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs leading-relaxed">{t('home.footerMotto')}</p>
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
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-xs">
            <a
              href="https://simtaiwan.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              SIM Taiwan Home
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://github.com/Fruitful-Tools/sim-weekly-prayers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                className="h-3 w-3 fill-current"
                aria-label="GitHub"
              >
                <path d={siGithub.path} />
              </svg>
              {t('footer.contribute')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
