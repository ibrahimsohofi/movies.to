import { db } from '../config/database.js';
import { getCache, setCache, deleteCache } from '../config/redis.js';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Cache TTLs
const CACHE_TTL = {
  recommendations: 3600, // 1 hour
  embeddings: 86400, // 24 hours
  trending: 1800, // 30 minutes
  userProfile: 7200, // 2 hours
};

// =====================================================
// TF-IDF Implementation for Content-Based Filtering
// =====================================================

class TFIDFVectorizer {
  constructor() {
    this.vocabulary = new Map();
    this.idf = new Map();
    this.documentCount = 0;
  }

  // Tokenize and preprocess text
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  // Calculate term frequency
  calculateTF(tokens) {
    const tf = new Map();
    tokens.forEach(token => {
      tf.set(token, (tf.get(token) || 0) + 1);
    });
    // Normalize by document length
    const docLength = tokens.length;
    tf.forEach((count, token) => {
      tf.set(token, count / docLength);
    });
    return tf;
  }

  // Fit the vectorizer on a corpus
  fit(documents) {
    const docFrequency = new Map();
    this.documentCount = documents.length;

    documents.forEach((doc, idx) => {
      const tokens = new Set(this.tokenize(doc));
      tokens.forEach(token => {
        if (!this.vocabulary.has(token)) {
          this.vocabulary.set(token, this.vocabulary.size);
        }
        docFrequency.set(token, (docFrequency.get(token) || 0) + 1);
      });
    });

    // Calculate IDF
    docFrequency.forEach((df, token) => {
      this.idf.set(token, Math.log((this.documentCount + 1) / (df + 1)) + 1);
    });
  }

  // Transform a document to TF-IDF vector
  transform(text) {
    const tokens = this.tokenize(text);
    const tf = this.calculateTF(tokens);
    const vector = new Array(this.vocabulary.size).fill(0);

    tf.forEach((tfValue, token) => {
      if (this.vocabulary.has(token)) {
        const idx = this.vocabulary.get(token);
        const idfValue = this.idf.get(token) || 1;
        vector[idx] = tfValue * idfValue;
      }
    });

    return vector;
  }
}

// =====================================================
// Cosine Similarity
// =====================================================

function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

// =====================================================
// User Profile Builder
// =====================================================

export async function buildUserProfile(userId) {
  const cacheKey = `user_profile:${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    // Get user's watched movies with ratings
    const watchedMovies = db.prepare(`
      SELECT w.tmdb_id, w.movie_data, r.rating
      FROM watchlist w
      LEFT JOIN reviews r ON w.user_id = r.user_id AND w.tmdb_id = r.tmdb_id
      WHERE w.user_id = ?
    `).all(userId);

    // Get user's reviews
    const reviews = db.prepare(`
      SELECT tmdb_id, rating, movie_data FROM reviews WHERE user_id = ?
    `).all(userId);

    // Calculate genre preferences
    const genreScores = {};
    const decadePreferences = {};
    const languagePreferences = {};
    const keywordFrequency = {};

    const processMovie = (movieData, rating = 7) => {
      if (!movieData) return;
      const movie = typeof movieData === 'string' ? JSON.parse(movieData) : movieData;
      const weight = rating / 10;

      // Genre preferences
      movie.genres?.forEach(genre => {
        genreScores[genre.id] = (genreScores[genre.id] || 0) + weight;
      });

      // Decade preferences
      if (movie.release_date) {
        const year = new Date(movie.release_date).getFullYear();
        const decade = Math.floor(year / 10) * 10;
        decadePreferences[decade] = (decadePreferences[decade] || 0) + weight;
      }

      // Language preferences
      if (movie.original_language) {
        languagePreferences[movie.original_language] =
          (languagePreferences[movie.original_language] || 0) + weight;
      }
    };

    watchedMovies.forEach(m => processMovie(m.movie_data, m.rating || 7));
    reviews.forEach(r => processMovie(r.movie_data, r.rating));

    // Normalize scores
    const normalizeScores = (scores) => {
      const max = Math.max(...Object.values(scores), 1);
      const normalized = {};
      Object.keys(scores).forEach(key => {
        normalized[key] = scores[key] / max;
      });
      return normalized;
    };

    const profile = {
      userId,
      genrePreferences: normalizeScores(genreScores),
      decadePreferences: normalizeScores(decadePreferences),
      languagePreferences: normalizeScores(languagePreferences),
      totalMoviesWatched: watchedMovies.length,
      averageRating: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
      updatedAt: new Date().toISOString(),
    };

    await setCache(cacheKey, profile, CACHE_TTL.userProfile);
    return profile;
  } catch (error) {
    console.error('Build user profile error:', error);
    return null;
  }
}

// =====================================================
// Content-Based Recommendations
// =====================================================

export async function getContentBasedRecommendations(userId, limit = 20) {
  try {
    const profile = await buildUserProfile(userId);
    if (!profile) return [];

    // Get user's top genres
    const topGenres = Object.entries(profile.genrePreferences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);

    if (topGenres.length === 0) return [];

    // Get movies user has already seen
    const seenMovies = new Set();
    const userMovies = db.prepare(`
      SELECT tmdb_id FROM watchlist WHERE user_id = ?
      UNION SELECT tmdb_id FROM reviews WHERE user_id = ?
    `).all(userId, userId);
    userMovies.forEach(m => seenMovies.add(m.tmdb_id));

    // Fetch recommendations from TMDB
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        with_genres: topGenres.join(','),
        sort_by: 'vote_average.desc',
        'vote_count.gte': 100,
        page: 1,
      },
    });

    const recommendations = [];
    for (const movie of response.data.results || []) {
      if (seenMovies.has(movie.id)) continue;
      if (recommendations.length >= limit) break;

      // Calculate score based on user profile match
      let score = movie.vote_average / 10;

      // Boost for matching genres
      movie.genre_ids?.forEach(genreId => {
        if (profile.genrePreferences[genreId]) {
          score += profile.genrePreferences[genreId] * 0.1;
        }
      });

      // Boost for matching decade
      if (movie.release_date) {
        const decade = Math.floor(new Date(movie.release_date).getFullYear() / 10) * 10;
        if (profile.decadePreferences[decade]) {
          score += profile.decadePreferences[decade] * 0.05;
        }
      }

      recommendations.push({
        movie_id: movie.id,
        movie_data: movie,
        score: Math.min(score, 1),
        algorithm: 'content_based',
        explanation: `Matches your preference for ${topGenres.length > 0 ? 'your favorite genres' : 'popular movies'}`,
        confidence: 0.8,
      });
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error('Content-based recommendations error:', error);
    return [];
  }
}

// =====================================================
// Mood-Based Recommendations
// =====================================================

export const MOOD_GENRE_MAP = {
  happy: [35, 10751, 16], // Comedy, Family, Animation
  sad: [18, 10749], // Drama, Romance
  excited: [28, 12, 878], // Action, Adventure, Sci-Fi
  scared: [27, 53], // Horror, Thriller
  relaxed: [99, 36, 10402], // Documentary, History, Music
  romantic: [10749, 35], // Romance, Comedy
  adventurous: [12, 14, 878], // Adventure, Fantasy, Sci-Fi
  nostalgic: [10751, 16, 35], // Family, Animation, Comedy
  thoughtful: [18, 9648, 99], // Drama, Mystery, Documentary
  energetic: [28, 80, 53], // Action, Crime, Thriller
};

export async function getMoodBasedRecommendations(userId, mood, limit = 20) {
  try {
    const genres = MOOD_GENRE_MAP[mood.toLowerCase()];
    if (!genres) return [];

    // Get movies user has already seen
    const seenMovies = new Set();
    const userMovies = db.prepare(`
      SELECT tmdb_id FROM watchlist WHERE user_id = ?
      UNION SELECT tmdb_id FROM reviews WHERE user_id = ?
    `).all(userId, userId);
    userMovies.forEach(m => seenMovies.add(m.tmdb_id));

    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        with_genres: genres.join(','),
        sort_by: 'popularity.desc',
        'vote_count.gte': 50,
        page: 1,
      },
    });

    const recommendations = (response.data.results || [])
      .filter(movie => !seenMovies.has(movie.id))
      .slice(0, limit)
      .map(movie => ({
        movie_id: movie.id,
        movie_data: movie,
        score: movie.vote_average / 10,
        algorithm: 'mood',
        explanation: `Perfect for when you're feeling ${mood}`,
        confidence: 0.75,
      }));

    return recommendations;
  } catch (error) {
    console.error('Mood-based recommendations error:', error);
    return [];
  }
}

// =====================================================
// "Because You Watched" Recommendations
// =====================================================

export async function getBecauseYouWatchedRecommendations(userId, limit = 20) {
  try {
    // Get user's recently watched/highly rated movies
    const recentMovies = db.prepare(`
      SELECT DISTINCT tmdb_id, movie_data,
        COALESCE(r.rating, 7) as rating,
        COALESCE(r.created_at, w.created_at) as activity_date
      FROM watchlist w
      LEFT JOIN reviews r ON w.user_id = r.user_id AND w.tmdb_id = r.tmdb_id
      WHERE w.user_id = ? AND w.movie_data IS NOT NULL
      ORDER BY activity_date DESC
      LIMIT 5
    `).all(userId);

    if (recentMovies.length === 0) return [];

    const recommendations = [];
    const seenMovies = new Set();

    // Get all user's movies
    const userMovies = db.prepare(`
      SELECT tmdb_id FROM watchlist WHERE user_id = ?
      UNION SELECT tmdb_id FROM reviews WHERE user_id = ?
    `).all(userId, userId);
    userMovies.forEach(m => seenMovies.add(m.tmdb_id));

    for (const sourceMovie of recentMovies) {
      try {
        const movieData = typeof sourceMovie.movie_data === 'string'
          ? JSON.parse(sourceMovie.movie_data)
          : sourceMovie.movie_data;

        const response = await axios.get(
          `${TMDB_BASE_URL}/movie/${sourceMovie.tmdb_id}/similar`,
          { params: { api_key: TMDB_API_KEY, page: 1 } }
        );

        for (const similar of response.data.results || []) {
          if (seenMovies.has(similar.id)) continue;
          if (recommendations.some(r => r.movie_id === similar.id)) continue;

          recommendations.push({
            movie_id: similar.id,
            movie_data: similar,
            score: (similar.vote_average / 10) * (sourceMovie.rating / 10),
            algorithm: 'because_watched',
            explanation: `Because you watched "${movieData.title}"`,
            source_movie_id: sourceMovie.tmdb_id,
            source_movie_title: movieData.title,
            confidence: 0.85,
          });
        }
      } catch (error) {
        console.error(`Error fetching similar for ${sourceMovie.tmdb_id}:`, error);
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Because you watched recommendations error:', error);
    return [];
  }
}

// =====================================================
// Trending with Decay Factor
// =====================================================

export async function getTrendingRecommendations(userId, limit = 20) {
  const cacheKey = `trending:${limit}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    // Filter out user's already seen movies
    const seenMovies = new Set();
    const userMovies = db.prepare(`
      SELECT tmdb_id FROM watchlist WHERE user_id = ?
      UNION SELECT tmdb_id FROM reviews WHERE user_id = ?
    `).all(userId, userId);
    userMovies.forEach(m => seenMovies.add(m.tmdb_id));

    return cached.filter(r => !seenMovies.has(r.movie_id));
  }

  try {
    // Get trending movies from TMDB
    const [trendingDay, trendingWeek] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/trending/movie/day`, {
        params: { api_key: TMDB_API_KEY },
      }),
      axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
        params: { api_key: TMDB_API_KEY },
      }),
    ]);

    const trendingMap = new Map();

    // Day trending with higher weight
    (trendingDay.data.results || []).forEach((movie, idx) => {
      const decayFactor = 1 / (1 + idx * 0.1);
      trendingMap.set(movie.id, {
        movie_id: movie.id,
        movie_data: movie,
        score: (movie.vote_average / 10) * 0.4 + (movie.popularity / 1000) * 0.3 + decayFactor * 0.3,
        algorithm: 'trending',
        explanation: 'Trending right now',
        confidence: 0.9,
      });
    });

    // Week trending with lower weight
    (trendingWeek.data.results || []).forEach((movie, idx) => {
      if (trendingMap.has(movie.id)) {
        const existing = trendingMap.get(movie.id);
        existing.score += 0.1; // Boost for being in both
      } else {
        const decayFactor = 1 / (1 + idx * 0.15);
        trendingMap.set(movie.id, {
          movie_id: movie.id,
          movie_data: movie,
          score: (movie.vote_average / 10) * 0.35 + (movie.popularity / 1000) * 0.25 + decayFactor * 0.2,
          algorithm: 'trending',
          explanation: 'Trending this week',
          confidence: 0.85,
        });
      }
    });

    const recommendations = Array.from(trendingMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit * 2);

    await setCache(cacheKey, recommendations, CACHE_TTL.trending);

    // Filter out user's already seen movies
    const seenMovies = new Set();
    const userMovies = db.prepare(`
      SELECT tmdb_id FROM watchlist WHERE user_id = ?
      UNION SELECT tmdb_id FROM reviews WHERE user_id = ?
    `).all(userId, userId);
    userMovies.forEach(m => seenMovies.add(m.tmdb_id));

    return recommendations.filter(r => !seenMovies.has(r.movie_id)).slice(0, limit);
  } catch (error) {
    console.error('Trending recommendations error:', error);
    return [];
  }
}

// =====================================================
// Hybrid AI Recommendations (Ensemble Method)
// =====================================================

export async function getHybridAIRecommendations(userId, options = {}) {
  const {
    limit = 20,
    mood = null,
    includeTrending = true,
    includeBecauseWatched = true,
    includeContentBased = true,
  } = options;

  const cacheKey = `ai_recommendations:${userId}:${JSON.stringify(options)}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const promises = [];

    if (includeContentBased) {
      promises.push(getContentBasedRecommendations(userId, limit));
    }
    if (includeBecauseWatched) {
      promises.push(getBecauseYouWatchedRecommendations(userId, limit));
    }
    if (includeTrending) {
      promises.push(getTrendingRecommendations(userId, limit));
    }
    if (mood) {
      promises.push(getMoodBasedRecommendations(userId, mood, limit));
    }

    const results = await Promise.all(promises);
    const allRecommendations = new Map();

    // Weights for different algorithms
    const weights = {
      content_based: 0.35,
      because_watched: 0.30,
      trending: 0.20,
      mood: 0.15,
    };

    results.flat().forEach(rec => {
      const existing = allRecommendations.get(rec.movie_id);
      const weight = weights[rec.algorithm] || 0.25;

      if (existing) {
        existing.score += rec.score * weight;
        existing.algorithms.push(rec.algorithm);
        if (!existing.explanations.includes(rec.explanation)) {
          existing.explanations.push(rec.explanation);
        }
      } else {
        allRecommendations.set(rec.movie_id, {
          ...rec,
          score: rec.score * weight,
          algorithms: [rec.algorithm],
          explanations: [rec.explanation],
        });
      }
    });

    const finalRecommendations = Array.from(allRecommendations.values())
      .map(rec => ({
        ...rec,
        explanation: rec.explanations[0],
        algorithm: 'hybrid',
        algorithms_used: rec.algorithms,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache recommendations
    await setCache(cacheKey, finalRecommendations, CACHE_TTL.recommendations);

    // Store in database for analytics
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO ml_recommendations
        (user_id, movie_id, algorithm_type, score, explanation, confidence, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+1 hour'))
      `);

      finalRecommendations.forEach(rec => {
        stmt.run(
          userId,
          rec.movie_id,
          'hybrid',
          rec.score,
          rec.explanation,
          rec.confidence || 0.8
        );
      });
    } catch (dbError) {
      console.error('Failed to cache recommendations in DB:', dbError);
    }

    return finalRecommendations;
  } catch (error) {
    console.error('Hybrid AI recommendations error:', error);
    return [];
  }
}

// =====================================================
// Track User Interaction for ML Training
// =====================================================

export async function trackInteraction(userId, movieId, interactionType, value = null, sessionId = null) {
  try {
    db.prepare(`
      INSERT INTO user_interactions (user_id, movie_id, interaction_type, interaction_value, session_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, movieId, interactionType, value, sessionId);

    // Invalidate user profile cache
    await deleteCache(`user_profile:${userId}`);
    await deleteCache(`ai_recommendations:${userId}:*`);

    return true;
  } catch (error) {
    console.error('Track interaction error:', error);
    return false;
  }
}

// =====================================================
// Export all functions
// =====================================================

export default {
  buildUserProfile,
  getContentBasedRecommendations,
  getMoodBasedRecommendations,
  getBecauseYouWatchedRecommendations,
  getTrendingRecommendations,
  getHybridAIRecommendations,
  trackInteraction,
  cosineSimilarity,
  MOOD_GENRE_MAP,
};
