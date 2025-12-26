import { generateRecommendations, getCachedRecommendations } from '../services/recommendationEngine.js';
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
