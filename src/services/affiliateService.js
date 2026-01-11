// Affiliate Service for tracking clicks and generating affiliate links
// This supports integration with Amazon, iTunes, Google Play, and streaming services

const AFFILIATE_IDS = {
  amazon: import.meta.env.VITE_AMAZON_AFFILIATE_ID || 'moviesto-20',
  itunes: import.meta.env.VITE_ITUNES_AFFILIATE_ID || '',
  googlePlay: import.meta.env.VITE_GOOGLE_PLAY_AFFILIATE_ID || '',
};

// Provider to affiliate mapping
const AFFILIATE_MAPPING = {
  'Amazon Prime Video': 'amazon',
  'Amazon Video': 'amazon',
  'Apple TV': 'itunes',
  'Apple iTunes': 'itunes',
  'Google Play Movies': 'googlePlay',
};

/**
 * Generate affiliate URL for a provider
 * @param {string} providerName - Name of the streaming provider
 * @param {number} movieId - TMDB movie ID
 * @param {string} movieTitle - Title of the movie
 * @returns {string|null} Affiliate URL or null if not applicable
 */
export function generateAffiliateUrl(providerName, movieId, movieTitle) {
  const affiliateType = AFFILIATE_MAPPING[providerName];

  if (!affiliateType) {
    return null;
  }

  switch (affiliateType) {
    case 'amazon':
      // Amazon affiliate link format
      const amazonTag = AFFILIATE_IDS.amazon;
      const searchQuery = encodeURIComponent(movieTitle);
      return amazonTag
        ? `https://www.amazon.com/s?k=${searchQuery}&tag=${amazonTag}`
        : null;

    case 'itunes':
      // iTunes affiliate link format
      const itunesId = AFFILIATE_IDS.itunes;
      const itunesQuery = encodeURIComponent(movieTitle);
      return itunesId
        ? `https://tv.apple.com/search?term=${itunesQuery}&at=${itunesId}`
        : null;

    case 'googlePlay':
      // Google Play affiliate link (limited support)
      const googleQuery = encodeURIComponent(movieTitle);
      return `https://play.google.com/store/search?q=${googleQuery}&c=movies`;

    default:
      return null;
  }
}

/**
 * Track affiliate click
 * @param {string} providerName - Name of the provider clicked
 * @param {number} movieId - TMDB movie ID
 */
export async function trackAffiliateClick(providerName, movieId) {
  try {
    // Send analytics event (can be connected to backend API)
    if (window.gtag) {
      window.gtag('event', 'affiliate_click', {
        provider: providerName,
        movie_id: movieId,
        timestamp: new Date().toISOString(),
      });
    }

    // Optional: Send to your backend for tracking
    // await fetch('/api/analytics/affiliate-click', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     provider: providerName,
    //     movieId,
    //     timestamp: Date.now(),
    //   }),
    // });

    console.log(`Affiliate click tracked: ${providerName} for movie ${movieId}`);
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
  }
}

/**
 * Check if provider has affiliate support
 * @param {string} providerName - Name of the provider
 * @returns {boolean} True if provider has affiliate support
 */
export function hasAffiliateSupport(providerName) {
  return !!AFFILIATE_MAPPING[providerName];
}

/**
 * Get all supported affiliate providers
 * @returns {string[]} Array of provider names with affiliate support
 */
export function getSupportedAffiliateProviders() {
  return Object.keys(AFFILIATE_MAPPING);
}

export default {
  generateAffiliateUrl,
  trackAffiliateClick,
  hasAffiliateSupport,
  getSupportedAffiliateProviders,
};
