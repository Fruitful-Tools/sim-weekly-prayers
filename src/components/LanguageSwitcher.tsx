import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'en' ? 'zh-TW' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en' ? '繁體中文' : 'English';
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={toggleLanguage}
      className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
    >
      <Globe className="h-4 w-4" />
      {getCurrentLanguageLabel()}
    </Button>
  );
};

export default LanguageSwitcher;