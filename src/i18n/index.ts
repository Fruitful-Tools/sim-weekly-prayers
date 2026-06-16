import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zhTW from './locales/zh-TW.json';

const resources = {
  en: {
    translation: en,
  },
  'zh-TW': {
    translation: zhTW,
  },
};

// Get saved language from localStorage or default to Traditional Chinese
const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('language-preference');
  return savedLanguage || 'zh-TW';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'zh-TW',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
});

// Map an i18n language code to a valid BCP-47 tag for <html lang>. Screen
// readers and search engines rely on this; the app defaults to zh-TW content,
// so the document must not advertise itself as English.
const toHtmlLang = (lng: string) => (lng === 'zh-TW' ? 'zh-Hant-TW' : lng);

const applyHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = toHtmlLang(lng);
  }
};

// Sync on initial load (covers the case where the saved preference differs from
// the static lang baked into index.html) and on every subsequent switch.
applyHtmlLang(i18n.language);

// Save language changes to localStorage and keep <html lang> in sync.
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language-preference', lng);
  applyHtmlLang(lng);
});

export default i18n;
