import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import LanguageSwitcher from './LanguageSwitcher';
import { Heart } from 'lucide-react';

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-xl font-semibold text-primary hover:text-primary-glow transition-colors"
          >
            <Heart className="h-6 w-6" />
            <span>{t('home.title')}</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/') ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/prayers"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/prayers') ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t('nav.prayers')}
            </Link>
          </div>
        </div>
        
        <LanguageSwitcher />
      </div>
    </nav>
  );
};

export default Navigation;