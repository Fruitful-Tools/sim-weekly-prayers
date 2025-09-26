import { useTranslation } from 'react-i18next';
import { Settings, Type, Palette, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFontSize } from '@/contexts/FontContext';
import ThemeToggle from './ThemeToggle';

const SettingsDropdown = () => {
  const { t, i18n } = useTranslation();
  const { fontSize, setFontSize } = useFontSize();

  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'en' ? 'zh-TW' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en' ? '繁體中文' : 'English';
  };

  const fontSizes = [
    { value: 'small' as const, label: t('settings.fontSize.small') },
    { value: 'medium' as const, label: t('settings.fontSize.medium') },
    { value: 'large' as const, label: t('settings.fontSize.large') },
    { value: 'extra-large' as const, label: t('settings.fontSize.extraLarge') },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Settings className="h-4 w-4" />
          <span className="sr-only">{t('settings.title')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {t('settings.title')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Palette className="h-3 w-3" />
          {t('settings.theme')}
        </DropdownMenuLabel>
        <div className="px-2 py-1">
          <ThemeToggle />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          {t('nav.language')}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={toggleLanguage}>
          <Globe className="h-4 w-4 mr-2" />
          {getCurrentLanguageLabel()}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Type className="h-3 w-3" />
          {t('settings.fontSize.title')}
        </DropdownMenuLabel>
        {fontSizes.map((size) => (
          <DropdownMenuItem
            key={size.value}
            onClick={() => setFontSize(size.value)}
            className={fontSize === size.value ? 'bg-accent' : ''}
          >
            <span className={fontSize === size.value ? 'font-medium' : ''}>
              {size.label}
            </span>
            {fontSize === size.value && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsDropdown;
