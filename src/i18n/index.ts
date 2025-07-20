import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zhTW from './locales/zh-TW.json';

const resources = {
  en: {
    translation: en
  },
  'zh-TW': {
    translation: zhTW
  }
};

// Get saved language from localStorage or default to Traditional Chinese
const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('language-preference');
  return savedLanguage || 'zh-TW';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'zh-TW',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language-preference', lng);
});

export default i18n;