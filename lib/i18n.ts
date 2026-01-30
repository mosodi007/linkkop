import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const en = require('../locales/en.json');
const es = require('../locales/es.json');
const fr = require('../locales/fr.json');

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
