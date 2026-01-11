import { generateRecommendations, getCachedRecommendations } from '../services/recommendationEngine.js';
import {
  getHybridAIRecommendations,
  getMoodBasedRecommendations,
  getBecauseYouWatchedRecommendations,
  getContentBasedRecommendations,
  getTrendingRecommendations,
  buildUserProfile,
  trackInteraction,
  MOOD_GENRE_MAP,
} from '../services/aiRecommendationService.js';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Get recommendations for user
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    // Try to get cached recommendations first
    let recommendations = getCachedRecommendations(userId, limit);

    // If no cached recommendations or cache is old, generate new ones
    if (recommendations.length === 0) {
      recommendations = await generateRecommendations(userId, limit);
    }

    // Fetch movie details from TMDB
    const moviesWithDetails = await Promise.all(
      recommendations.map(async (rec) => {
        try {
          const response = await axios.get(`${TMDB_BASE_URL}/movie/${rec.movie_id}`, {
            params: { api_key: TMDB_API_KEY },
          });
          return {
            ...response.data,
            recommendationScore: rec.score,
            recommendationReason: rec.reason || rec.reasons,
          };
        } catch (error) {
          console.error(`Failed to fetch movie ${rec.movie_id}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls
    const validMovies = moviesWithDetails.filter(m => m !== null);

    res.json({
      recommendations: validMovies,
      count: validMovies.length,
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};

// Force refresh recommendations
export const refreshRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const recommendations = await generateRecommendations(userId, limit);

    // Fetch movie details from TMDB
    const moviesWithDetails = await Promise.all(
      recommendations.map(async (rec) => {
        try {
          const response = await axios.get(`${TMDB_BASE_URL}/movie/${rec.movie_id}`, {
            params: { api_key: TMDB_API_KEY },
          });
          return {
            ...response.data,
            recommendationScore: rec.score,
            recommendationReason: rec.reasons.join('; '),
          };
        } catch (error) {
          console.error(`Failed to fetch movie ${rec.movie_id}:`, error);
          return null;
        }
      })
    );

    const validMovies = moviesWithDetails.filter(m => m !== null);

    res.json({
      recommendations: validMovies,
      count: validMovies.length,
      refreshed: true,
    });
  } catch (error) {
    console.error('Refresh recommendations error:', error);
    res.status(500).json({ error: 'Failed to refresh recommendations' });
  }
};

// Get similar movies
export const getSimilarMovies = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;

    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}/similar`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Get similar movies error:', error);
    res.status(500).json({ error: 'Failed to fetch similar movies' });
  }
};

// =====================================================
// AI-Powered Recommendation Endpoints
// =====================================================

// Get hybrid AI recommendations (ensemble method)
export const getAIRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, mood, includeTrending = true } = req.query;

    const recommendations = await getHybridAIRecommendations(userId, {
      limit: parseInt(limit),
      mood: mood || null,
      includeTrending: includeTrending === 'true',
      includeBecauseWatched: true,
      includeContentBased: true,
    });

    res.json({
      recommendations: recommendations.map(rec => ({
        movie: rec.movie_data,
        score: rec.score,
        explanation: rec.explanation,
        algorithm: rec.algorithm,
        algorithms_used: rec.algorithms_used,
        confidence: rec.confidence,
      })),
      count: recommendations.length,
      algorithm: 'hybrid_ai',
    });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch AI recommendations' });
  }
};

// Get mood-based recommendations
export const getMoodRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mood } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    if (!MOOD_GENRE_MAP[mood.toLowerCase()]) {
      return res.status(400).json({
        error: 'Invalid mood',
        validMoods: Object.keys(MOOD_GENRE_MAP),
      });
    }

    const recommendations = await getMoodBasedRecommendations(userId, mood, limit);

    res.json({
      recommendations: recommendations.map(rec => ({
        movie: rec.movie_data,
        score: rec.score,
        explanation: rec.explanation,
        confidence: rec.confidence,
      })),
      count: recommendations.length,
      mood,
      algorithm: 'mood_based',
    });
  } catch (error) {
    console.error('Mood recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch mood recommendations' });
  }
};

// Get "because you watched" recommendations
export const getBecauseWatched = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const recommendations = await getBecauseYouWatchedRecommendations(userId, limit);

    // Group by source movie
    const grouped = {};
    recommendations.forEach(rec => {
      const sourceId = rec.source_movie_id;
      if (!grouped[sourceId]) {
        grouped[sourceId] = {
          source_movie: {
            id: sourceId,
            title: rec.source_movie_title,
          },
          recommendations: [],
        };
      }
      grouped[sourceId].recommendations.push({
        movie: rec.movie_data,
        score: rec.score,
        confidence: rec.confidence,
      });
    });

    res.json({
      groups: Object.values(grouped),
      total_count: recommendations.length,
      algorithm: 'because_watched',
    });
  } catch (error) {
    console.error('Because watched recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};

// Get content-based recommendations
export const getContentBased = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const recommendations = await getContentBasedRecommendations(userId, limit);

    res.json({
      recommendations: recommendations.map(rec => ({
        movie: rec.movie_data,
        score: rec.score,
        explanation: rec.explanation,
        confidence: rec.confidence,
      })),
      count: recommendations.length,
      algorithm: 'content_based',
    });
  } catch (error) {
    console.error('Content-based recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};

// Get trending recommendations
export const getTrending = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const recommendations = await getTrendingRecommendations(userId, limit);

    res.json({
      recommendations: recommendations.map(rec => ({
        movie: rec.movie_data,
        score: rec.score,
        explanation: rec.explanation,
        confidence: rec.confidence,
      })),
      count: recommendations.length,
      algorithm: 'trending',
    });
  } catch (error) {
    console.error('Trending recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
};

// Get user's recommendation profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await buildUserProfile(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found. Rate some movies first!' });
    }

    res.json({
      profile,
      availableMoods: Object.keys(MOOD_GENRE_MAP),
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Track user interaction for ML training
export const trackUserInteraction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { movieId, interactionType, value, sessionId } = req.body;

    if (!movieId || !interactionType) {
      return res.status(400).json({ error: 'movieId and interactionType are required' });
    }

    const validTypes = ['view', 'click', 'watchlist_add', 'watchlist_remove', 'rating', 'watch_complete', 'skip'];
    if (!validTypes.includes(interactionType)) {
      return res.status(400).json({ error: 'Invalid interaction type', validTypes });
    }

    const success = await trackInteraction(userId, movieId, interactionType, value, sessionId);

    res.json({ success, message: 'Interaction tracked' });
  } catch (error) {
    console.error('Track interaction error:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
};

// Get available moods
export const getAvailableMoods = (req, res) => {
  res.json({
    moods: Object.keys(MOOD_GENRE_MAP).map(mood => ({
      id: mood,
      name: mood.charAt(0).toUpperCase() + mood.slice(1),
      genres: MOOD_GENRE_MAP[mood],
    })),
  });
};
