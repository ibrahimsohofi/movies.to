import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance for AI recommendations
const aiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Longer timeout for AI processing
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token
aiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors gracefully for AI features
aiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Silently fail for AI endpoints - these are enhancements that shouldn't break the app
    console.error('AI Recommendations API error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * AI Recommendations API Service
 * Provides methods to interact with AI-powered recommendation endpoints
 */
export const aiRecommendationsAPI = {
  /**
   * Get hybrid AI recommendations (combines multiple algorithms)
   * @param {Object} options - Options for recommendations
   * @param {number} options.limit - Number of recommendations to return
   * @param {string} options.algorithm - Algorithm type: 'hybrid', 'content_based', 'collaborative', 'trending'
   * @returns {Promise<Object>} Recommendations with explanations and confidence scores
   */
  getRecommendations: async (options = {}) => {
    try {
      const { limit = 20, algorithm = 'hybrid' } = options;
      const response = await aiClient.get('/recommendations/ai', {
        params: { limit, algorithm }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
      return { recommendations: [], algorithm: 'fallback' };
    }
  },

  /**
   * Get mood-based recommendations
   * @param {string} mood - User's current mood (e.g., 'happy', 'sad', 'excited')
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Object>} Mood-matched movie recommendations
   */
  getMoodRecommendations: async (mood, limit = 12) => {
    try {
      const response = await aiClient.get(`/recommendations/ai/mood/${mood}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get mood recommendations:', error);
      return { recommendations: [], mood };
    }
  },

  /**
   * Get "Because You Watched" recommendations
   * @param {number} movieId - TMDB ID of the source movie
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Object>} Similar movie recommendations
   */
  getBecauseYouWatched: async (movieId, limit = 10) => {
    try {
      const response = await aiClient.get('/recommendations/ai/because-watched', {
        params: { movieId, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get because-watched recommendations:', error);
      return { recommendations: [], source_movie_id: movieId };
    }
  },

  /**
   * Get content-based recommendations using TF-IDF
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Object>} Content-based recommendations
   */
  getContentBased: async (limit = 20) => {
    try {
      const response = await aiClient.get('/recommendations/ai/content-based', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get content-based recommendations:', error);
      return { recommendations: [] };
    }
  },

  /**
   * Get trending recommendations with decay factor
   * @param {number} limit - Number of recommendations
   * @param {string} timeWindow - Time window: 'day', 'week', 'month'
   * @returns {Promise<Object>} Trending movie recommendations
   */
  getTrending: async (limit = 20, timeWindow = 'week') => {
    try {
      const response = await aiClient.get('/recommendations/ai/trending', {
        params: { limit, time_window: timeWindow }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get trending recommendations:', error);
      return { recommendations: [] };
    }
  },

  /**
   * Get user's recommendation profile (preferences, taste vectors)
   * @returns {Promise<Object>} User profile with taste vectors and preferences
   */
  getUserProfile: async () => {
    try {
      const response = await aiClient.get('/recommendations/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return { profile: null };
    }
  },

  /**
   * Track user interaction for ML training
   * @param {Object} interaction - Interaction data
   * @param {number} interaction.movieId - TMDB movie ID
   * @param {string} interaction.type - Interaction type: 'view', 'watchlist_add', 'rating', 'watch_complete'
   * @param {Object} interaction.metadata - Additional metadata (e.g., rating value, watch duration)
   * @returns {Promise<Object>} Confirmation
   */
  trackInteraction: async (interaction) => {
    try {
      const response = await aiClient.post('/recommendations/track', interaction);
      return response.data;
    } catch (error) {
      console.error('Failed to track interaction:', error);
      return { success: false };
    }
  },

  /**
   * Submit feedback on a recommendation
   * @param {Object} feedback - Feedback data
   * @param {number} feedback.recommendationId - Recommendation ID
   * @param {boolean} feedback.helpful - Whether the recommendation was helpful
   * @param {string} feedback.reason - Optional reason for feedback
   * @returns {Promise<Object>} Confirmation
   */
  submitFeedback: async (feedback) => {
    try {
      const response = await aiClient.post('/recommendations/feedback', feedback);
      return response.data;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return { success: false };
    }
  },

  /**
   * Get similar users (collaborative filtering)
   * @param {number} limit - Number of similar users
   * @returns {Promise<Object>} Similar users and their top picks
   */
  getSimilarUsers: async (limit = 10) => {
    try {
      const response = await aiClient.get('/recommendations/similar-users', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get similar users:', error);
      return { similar_users: [] };
    }
  },

  /**
   * Get personalized genre mix
   * @returns {Promise<Object>} User's preferred genre distribution
   */
  getGenreMix: async () => {
    try {
      const response = await aiClient.get('/recommendations/genre-mix');
      return response.data;
    } catch (error) {
      console.error('Failed to get genre mix:', error);
      return { genres: [] };
    }
  },

  /**
   * Refresh recommendations (forces recalculation)
   * @returns {Promise<Object>} Fresh recommendations
   */
  refresh: async () => {
    try {
      const response = await aiClient.post('/recommendations/refresh');
      toast.success('Recommendations refreshed!');
      return response.data;
    } catch (error) {
      console.error('Failed to refresh recommendations:', error);
      toast.error('Failed to refresh recommendations');
      return { success: false };
    }
  }
};

export default aiRecommendationsAPI;
