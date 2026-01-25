/**
 * Geolocation-based language detection
 * Detects user's country from IP and maps to appropriate language
 */

// Country code to language mapping
const countryToLanguage = {
  // English-speaking countries
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', ZA: 'en',
  IN: 'en', PK: 'en', NG: 'en', PH: 'en', SG: 'en', MY: 'en', KE: 'en',

  // Spanish-speaking countries
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', GQ: 'es',

  // French-speaking countries
  FR: 'fr', BE: 'fr', CH: 'fr', CA: 'fr', LU: 'fr', MC: 'fr', SN: 'fr',
  ML: 'fr', CI: 'fr', BF: 'fr', NE: 'fr', TG: 'fr', BJ: 'fr', BI: 'fr',
  CF: 'fr', CG: 'fr', GA: 'fr', GN: 'fr', MG: 'fr', RW: 'fr', TD: 'fr',

  // German-speaking countries
  DE: 'de', AT: 'de', LI: 'de',

  // Portuguese-speaking countries
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', GW: 'pt', TL: 'pt', CV: 'pt',
  ST: 'pt', MO: 'pt',

  // Italian-speaking countries
  IT: 'it', SM: 'it', VA: 'it',

  // Japanese-speaking countries
  JP: 'ja',

  // Korean-speaking countries
  KR: 'ko', KP: 'ko',

  // Arabic-speaking countries
  SA: 'ar', AE: 'ar', EG: 'ar', DZ: 'ar', IQ: 'ar', MA: 'ar', SD: 'ar',
  YE: 'ar', SY: 'ar', TN: 'ar', JO: 'ar', LY: 'ar', LB: 'ar', PS: 'ar',
  OM: 'ar', KW: 'ar', MR: 'ar', QA: 'ar', BH: 'ar', DJ: 'ar', KM: 'ar',
  SO: 'ar',
};

/**
 * Detect user's country from IP address
 * Uses multiple free geolocation APIs as fallbacks
 */
async function detectCountry() {
  const apis = [
    // ipapi.co - Free tier: 1000 requests/day
    {
      url: 'https://ipapi.co/json/',
      parse: (data) => data.country_code,
    },
    // ipwhois.app - Free tier: 10000 requests/month
    {
      url: 'https://ipwho.is/',
      parse: (data) => data.country_code,
    },
    // freeipapi.com - Free tier: 60 requests/minute
    {
      url: 'https://freeipapi.com/api/json',
      parse: (data) => data.countryCode,
    },
  ];

  for (const api of apis) {
    try {
      // Create a timeout promise
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(api.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Geolocation API ${api.url} returned status ${response.status}`);
        continue;
      }

      const data = await response.json();
      const countryCode = api.parse(data);

      if (countryCode && typeof countryCode === 'string') {
        console.log(`Detected country: ${countryCode} from ${api.url}`);
        return countryCode.toUpperCase();
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${api.url}:`, error.message);
      // Continue to next API
    }
  }

  console.warn('All geolocation APIs failed, returning null');
  return null;
}

/**
 * Get language code from country code
 */
export function getLanguageFromCountry(countryCode) {
  if (!countryCode) return null;
  return countryToLanguage[countryCode.toUpperCase()] || null;
}

/**
 * Detect language based on user's geographic location
 * Caches the result to avoid repeated API calls
 */
export async function detectLanguageFromGeolocation() {
  // Check if we already detected the location in this session
  const cachedCountry = sessionStorage.getItem('detected_country');
  if (cachedCountry) {
    const language = getLanguageFromCountry(cachedCountry);
    console.log(`Using cached country: ${cachedCountry} -> language: ${language}`);
    return language;
  }

  try {
    const countryCode = await detectCountry();

    if (countryCode) {
      // Cache the detected country for this session
      sessionStorage.setItem('detected_country', countryCode);

      const language = getLanguageFromCountry(countryCode);
      console.log(`Detected language from geolocation: ${language} (country: ${countryCode})`);
      return language;
    }
  } catch (error) {
    console.error('Error detecting language from geolocation:', error);
  }

  return null;
}

/**
 * Custom i18next language detector plugin
 */
export const geolocationDetector = {
  name: 'geolocationDetector',

  lookup() {
    // Check if we already auto-detected a language in a previous session
    const autoDetectedLanguage = localStorage.getItem('i18nextLng_auto');
    if (autoDetectedLanguage) {
      console.log('Using previously auto-detected language:', autoDetectedLanguage);
      return autoDetectedLanguage;
    }

    // Return undefined to let i18next continue with other detectors
    // The actual geolocation detection happens in config.js after initialization
    return undefined;
  },

  cacheUserLanguage(lng) {
    // When user manually changes language, clear the auto-detected flag
    localStorage.setItem('i18nextLng', lng);
    localStorage.removeItem('i18nextLng_auto');
  }
};
