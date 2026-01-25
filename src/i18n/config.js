import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { geolocationDetector, detectLanguageFromGeolocation } from './geolocation';

// Import translations
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ar from './locales/ar.json';

// Create a custom language detector that includes geolocation
const languageDetector = new LanguageDetector();
languageDetector.addDetector(geolocationDetector);

// Configure i18next
i18n
  .use(languageDetector) // Detect user language with geolocation
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      it: { translation: it },
      ja: { translation: ja },
      ko: { translation: ko },
      ar: { translation: ar }
    },
    fallbackLng: 'en', // Fallback language
    debug: true, // Set to true for debugging

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // Order of language detection
      // 1. Check localStorage for user's manual selection
      // 2. Use geolocation to detect country-based language
      // 3. Use browser language
      // 4. Check HTML tag
      order: ['localStorage', 'geolocationDetector', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: true, // Enable suspense for proper loading
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },
  });

// After initialization, check for geolocation-based language detection
// This runs in the background and updates language if detected
setTimeout(() => {
  const userLanguage = localStorage.getItem('i18nextLng');
  const autoDetectedLanguage = localStorage.getItem('i18nextLng_auto');

  // Only run geolocation if user hasn't manually selected a language
  // and we haven't auto-detected one yet
  if (!userLanguage && !autoDetectedLanguage) {
    console.log('Starting background geolocation detection...');
    detectLanguageFromGeolocation()
      .then((language) => {
        if (language && !localStorage.getItem('i18nextLng')) {
          console.log('Geolocation detected language:', language);
          localStorage.setItem('i18nextLng_auto', language);
          // Change language without reload
          i18n.changeLanguage(language);

          // Set RTL for Arabic
          if (language === 'ar') {
            document.documentElement.dir = 'rtl';
            document.documentElement.classList.add('rtl');
          } else {
            document.documentElement.dir = 'ltr';
            document.documentElement.classList.remove('rtl');
          }
        }
      })
      .catch((error) => {
        console.error('Geolocation detection failed:', error);
      });
  }
}, 100);

export default i18n;
