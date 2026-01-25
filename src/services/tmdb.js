import axios from 'axios';
import { toast } from 'sonner';
import i18n from '@/i18n/config';

const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

console.log('TMDB API Key:', TMDB_API_KEY ? 'Loaded' : 'Missing');

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor
tmdbClient.interceptors.request.use(
  (config) => {
    // Add current language to all requests for localized content
    const currentLanguage = i18n.language || 'en';
    config.params = {
      ...config.params,
      language: currentLanguage,
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
tmdbClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your internet connection.');
      return Promise.reject(error);
    }

    // Handle specific status codes
    switch (error.response.status) {
      case 401:
        toast.error('API key is invalid. Please check your configuration.');
        break;
      case 404:
        // Don't show toast for 404s, let components handle it
        break;
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      case 500:
      case 502:
      case 503:
        // Retry logic for server errors
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return tmdbClient(originalRequest);
          } catch (retryError) {
            toast.error('Server error. Please try again later.');
            return Promise.reject(retryError);
          }
        }
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error('An unexpected error occurred. Please try again.');
    }

    return Promise.reject(error);
  }
);

/**
 * Get TMDB image URL with environment-specific handling
 *
 * Development: Uses Vite proxy to bypass CORS/iframe restrictions in Same.new
 * Production: Uses TMDB CDN directly (works in standard browsers)
 *
 * @param {string} path - Image path from TMDB API (e.g., "/abc123.jpg")
 * @param {string} size - Image size: w92, w154, w185, w342, w500, w780, w1280, original
 * @returns {string|null} Full image URL or null if no path provided
 */
export const getImageUrl = (path, size = 'original') => {
  if (!path) return null;

  // In development, use the Vite proxy to bypass CORS/iframe restrictions
  if (import.meta.env.DEV) {
    return `/tmdb-images/${size}${path}`;
  }

  // In production, use direct TMDB CDN URL
  const imageUrl = `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  return imageUrl;
};

// Wrapper function for API calls with error handling
const apiCall = async (apiFunction, errorMessage = 'Failed to fetch data') => {
  try {
    const response = await apiFunction();
    return response.data;
  } catch (error) {
    console.error(errorMessage, error);
    // Error already handled by interceptor
    throw error;
  }
};

// Add sessionStorage caching helper
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const makeCacheKey = (endpoint, params = {}) => {
  const language = i18n.language || 'en';
  const search = new URLSearchParams({ ...params, language }).toString();
  return `tmdb:${endpoint}?${search}`;
};

const cachedGet = async (endpoint, params = {}, ttlMs = CACHE_TTL_MS) => {
  try {
    const key = makeCacheKey(endpoint, params);
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.ts < ttlMs) {
        return parsed.data;
      }
    }

    const response = await tmdbClient.get(endpoint, { params });
    const data = response.data;
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    return data;
  } catch (error) {
    // Let interceptor handle toasts; rethrow for callers
    throw error;
  }
};

// Movie endpoints
export const tmdbAPI = {
  // Get trending movies (supports pagination)
  getTrending: (timeWindow = 'week', page = 1) =>
    cachedGet(`/trending/movie/${timeWindow}`, { page }),

  // Get popular movies
  getPopular: (page = 1) =>
    cachedGet('/movie/popular', { page }),

  // Get top rated movies
  getTopRated: (page = 1) =>
    cachedGet('/movie/top_rated', { page }),

  // Get now playing movies
  getNowPlaying: (page = 1) =>
    cachedGet('/movie/now_playing', { page }),

  // Get upcoming movies
  getUpcoming: (page = 1) =>
    cachedGet('/movie/upcoming', { page }),

  // Get movie details
  getMovieDetails: (movieId) =>
    cachedGet(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,images,similar,recommendations,external_ids',
    }),

  // Search movies (light caching)
  searchMovies: (query, page = 1) =>
    cachedGet('/search/movie', { query, page }, 5 * 60 * 1000), // 5 minutes

  // Discover movies with filters
  discoverMovies: (filters = {}) =>
    cachedGet('/discover/movie', { ...filters }),

  // Get genres
  getGenres: () =>
    cachedGet('/genre/movie/list'),

  // Get movies by genre
  getMoviesByGenre: (genreId, page = 1) =>
    cachedGet('/discover/movie', { with_genres: genreId, page }),

  // Get watch providers for a movie
  getWatchProviders: (movieId) =>
    cachedGet(`/movie/${movieId}/watch/providers`),

  // Search with autocomplete (minimal cache)
  searchAutocomplete: (query) =>
    cachedGet('/search/movie', { query, page: 1 }, 2 * 60 * 1000), // 2 minutes

  // Get movies by multiple genres
  getMoviesByMultipleGenres: (genreIds, page = 1, sortBy = 'popularity.desc') =>
    cachedGet('/discover/movie', {
      with_genres: genreIds.join(','),
      page,
      sort_by: sortBy,
    }),

  // Get similar movies
  getSimilarMovies: (movieId, page = 1) =>
    cachedGet(`/movie/${movieId}/similar`, { page }),

  // Get recommended movies
  getRecommendations: (movieId, page = 1) =>
    cachedGet(`/movie/${movieId}/recommendations`, { page }),

  // Person endpoints
  getPersonDetails: (personId) =>
    cachedGet(`/person/${personId}`, {
      append_to_response: 'movie_credits,tv_credits,external_ids,images',
    }),

  getPersonMovieCredits: (personId) =>
    cachedGet(`/person/${personId}/movie_credits`),

  getPersonImages: (personId) =>
    cachedGet(`/person/${personId}/images`),
};

// Helper functions for direct access
export const fetchMovieDetails = (movieId) =>
  tmdbAPI.getMovieDetails(movieId);

export const fetchTVDetails = (tvId) =>
  cachedGet(`/tv/${tvId}`, {
    append_to_response: 'credits,videos,images,similar,recommendations,external_ids',
  });

export default tmdbClient;
