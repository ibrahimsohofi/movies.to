/**
 * Cache key utilities for consistent key generation
 * Format: {namespace}:{entity}:{id}[:{suffix}]
 */

/**
 * Movie-related cache keys
 */
export const movieKeys = {
  details: (tmdbId) => `movie:${tmdbId}`,
  videos: (tmdbId) => `movie:${tmdbId}:videos`,
  credits: (tmdbId) => `movie:${tmdbId}:credits`,
  similar: (tmdbId) => `movie:${tmdbId}:similar`,
  recommendations: (tmdbId) => `movie:${tmdbId}:recommendations`,
  reviews: (tmdbId, page = 1) => `movie:${tmdbId}:reviews:${page}`,
  providers: (tmdbId) => `movie:${tmdbId}:providers`,
};

/**
 * Search-related cache keys
 */
export const searchKeys = {
  movies: (query, page = 1) => `search:${encodeURIComponent(query)}:${page}`,
  filtered: (filters) => {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    return `search:filtered:${filterStr}`;
  },
};

/**
 * Trending cache keys
 */
export const trendingKeys = {
  movies: (period = 'week') => `trending:movies:${period}`,
  tv: (period = 'week') => `trending:tv:${period}`,
  all: (period = 'week') => `trending:all:${period}`,
};

/**
 * User-related cache keys
 */
export const userKeys = {
  profile: (userId) => `user:${userId}:profile`,
  watchlist: (userId) => `user:${userId}:watchlist`,
  reviews: (userId, page = 1) => `user:${userId}:reviews:${page}`,
  lists: (userId) => `user:${userId}:lists`,
  followers: (userId) => `user:${userId}:followers`,
  following: (userId) => `user:${userId}:following`,
  recommendations: (userId) => `user:${userId}:recommendations`,
  activity: (userId) => `user:${userId}:activity`,
  notifications: (userId) => `user:${userId}:notifications`,
};

/**
 * List-related cache keys
 */
export const listKeys = {
  details: (listId) => `list:${listId}`,
  movies: (listId) => `list:${listId}:movies`,
  public: (page = 1) => `lists:public:${page}`,
};

/**
 * Genre cache keys
 */
export const genreKeys = {
  all: () => 'genres:all',
  movies: (genreId, page = 1) => `genre:${genreId}:movies:${page}`,
};

/**
 * Person cache keys
 */
export const personKeys = {
  details: (personId) => `person:${personId}`,
  credits: (personId) => `person:${personId}:credits`,
  images: (personId) => `person:${personId}:images`,
};

/**
 * Discover cache keys
 */
export const discoverKeys = {
  movies: (filters) => {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    return `discover:movies:${filterStr}`;
  },
};

/**
 * Generate invalidation patterns
 */
export const invalidationPatterns = {
  user: (userId) => `user:${userId}:*`,
  movie: (tmdbId) => `movie:${tmdbId}:*`,
  list: (listId) => `list:${listId}:*`,
  search: () => 'search:*',
  trending: () => 'trending:*',
};

/**
 * TTL (Time To Live) constants in seconds
 */
export const TTL = {
  SHORT: 5 * 60,           // 5 minutes
  MEDIUM: 30 * 60,         // 30 minutes
  LONG: 60 * 60,           // 1 hour
  EXTENDED: 24 * 60 * 60,  // 24 hours
  WEEK: 7 * 24 * 60 * 60,  // 1 week
};

/**
 * Recommended TTL for different data types
 */
export const recommendedTTL = {
  movieDetails: TTL.LONG,        // 1 hour - movie data changes rarely
  searchResults: TTL.MEDIUM,     // 30 minutes - search results semi-static
  trending: TTL.SHORT,           // 5 minutes - trending changes frequently
  userProfile: TTL.MEDIUM,       // 30 minutes - user data changes occasionally
  recommendations: TTL.EXTENDED, // 24 hours - recommendations are expensive to compute
  staticLists: TTL.WEEK,         // 1 week - genre lists rarely change
};

export default {
  movieKeys,
  searchKeys,
  trendingKeys,
  userKeys,
  listKeys,
  genreKeys,
  personKeys,
  discoverKeys,
  invalidationPatterns,
  TTL,
  recommendedTTL,
};
