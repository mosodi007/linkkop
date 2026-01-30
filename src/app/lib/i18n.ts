import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';

const STORAGE_KEY = 'linkkop-lang';
const SUPPORTED = ['en', 'es', 'fr'] as const;

function getInitialLng(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.includes(stored as (typeof SUPPORTED)[number]))
    return stored;
  const browser = navigator.language.split('-')[0];
  if (SUPPORTED.includes(browser as (typeof SUPPORTED)[number])) return browser;
  return undefined;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
  },
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED],
  lng: getInitialLng(),
  interpolation: {
    escapeValue: false,
  },
});

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    localStorage.setItem(STORAGE_KEY, lng);
  });
}

export default i18n;
