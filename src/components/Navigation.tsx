import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import SettingsDropdown from './SettingsDropdown';
import { useAuth } from '@/hooks/useAuth';

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link
            to="/"
            className="flex items-center text-xl font-semibold transition-colors"
          >
            <img src="/sim_logo.png" alt="SIM Logo" className="h-8 w-auto" />
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/prayers"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isActive('/prayers') ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t('nav.prayers')}
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {user ? (
            <Link to="/profile">
              <Button variant="outline" size="sm" className="space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.profile')}</span>
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm">
                {t('nav.signIn')}
              </Button>
            </Link>
          )}

          <SettingsDropdown />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
