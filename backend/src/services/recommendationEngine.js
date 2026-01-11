import { db } from '../config/database.js';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Calculate genre preferences based on user's watchlist and ratings
export const calculateGenrePreferences = (userId) => {
  try {
    // Get user's watchlist and reviews
    const watchlist = db.prepare(`
      SELECT movie_data FROM watchlist WHERE user_id = ?
    `).all(userId);

    const reviews = db.prepare(`
      SELECT movie_data, rating FROM reviews WHERE user_id = ?
    `).all(userId);

    const genreScores = {};

    // Process watchlist
    watchlist.forEach(item => {
      if (!item.movie_data) return;
      const movie = JSON.parse(item.movie_data);
      movie.genres?.forEach(genre => {
        genreScores[genre.id] = (genreScores[genre.id] || 0) + 1;
      });
    });

    // Process reviews (weight by rating)
    reviews.forEach(item => {
      if (!item.movie_data) return;
      const movie = JSON.parse(item.movie_data);
      const rating = item.rating / 10; // Normalize to 0-1
      movie.genres?.forEach(genre => {
        genreScores[genre.id] = (genreScores[genre.id] || 0) + (rating * 2);
      });
    });

    // Normalize scores
    const maxScore = Math.max(...Object.values(genreScores), 1);
    const normalizedScores = {};
    Object.keys(genreScores).forEach(genreId => {
      normalizedScores[genreId] = genreScores[genreId] / maxScore;
    });

    return normalizedScores;
  } catch (error) {
    console.error('Calculate genre preferences error:', error);
    return {};
  }
};

// Find similar users based on rating patterns
export const findSimilarUsers = (userId, limit = 10) => {
  try {
    // Get user's ratings
    const userRatings = db.prepare(`
      SELECT tmdb_id, rating FROM reviews WHERE user_id = ?
    `).all(userId);

    if (userRatings.length === 0) return [];

    // Get other users who rated the same movies
    const movieIds = userRatings.map(r => r.tmdb_id);
    const similarUsers = db.prepare(`
      SELECT user_id, COUNT(*) as common_movies,
        AVG(ABS(r1.rating - r2.rating)) as avg_diff
      FROM reviews r1
      INNER JOIN reviews r2 ON r1.tmdb_id = r2.tmdb_id
      WHERE r1.user_id = ? AND r2.user_id != ?
        AND r1.tmdb_id IN (${movieIds.join(',')})
      GROUP BY r2.user_id
      HAVING common_movies >= 3
      ORDER BY common_movies DESC, avg_diff ASC
      LIMIT ?
    `).all(userId, userId, limit);

    return similarUsers;
  } catch (error) {
    console.error('Find similar users error:', error);
    return [];
  }
};

// Get recommendations from TMDB similar movies
export const getTMDBRecommendations = async (userId, limit = 20) => {
  try {
    // Get user's top rated movies
    const topMovies = db.prepare(`
      SELECT tmdb_id, rating FROM reviews
      WHERE user_id = ? AND rating >= 8
      ORDER BY rating DESC, created_at DESC
      LIMIT 5
    `).all(userId);

    if (topMovies.length === 0) {
      // Fall back to watchlist
      const watchlist = db.prepare(`
        SELECT tmdb_id FROM watchlist WHERE user_id = ? LIMIT 5
      `).all(userId);

      if (watchlist.length === 0) return [];
      topMovies.push(...watchlist.map(w => ({ tmdb_id: w.tmdb_id, rating: 8 })));
    }

    const recommendations = new Set();
    const seenMovies = new Set();

    // Get movies user has already seen
    const userMovies = db.prepare(`
      SELECT tmdb_id FROM watchlist WHERE user_id = ?
      UNION
      SELECT tmdb_id FROM reviews WHERE user_id = ?
    `).all(userId, userId);
    userMovies.forEach(m => seenMovies.add(m.tmdb_id));

    // Fetch similar movies from TMDB for each top movie
    for (const movie of topMovies) {
      try {
        const response = await axios.get(
          `${TMDB_BASE_URL}/movie/${movie.tmdb_id}/similar`,
          {
            params: { api_key: TMDB_API_KEY, page: 1 },
          }
        );

        response.data.results?.forEach(similar => {
          if (!seenMovies.has(similar.id) && recommendations.size < limit) {
            recommendations.add({
              movie_id: similar.id,
              score: similar.vote_average / 10,
              reason: `Similar to highly rated movies`,
            });
          }
        });
      } catch (error) {
        console.error(`Failed to fetch similar movies for ${movie.tmdb_id}:`, error);
      }
    }

    return Array.from(recommendations).slice(0, limit);
  } catch (error) {
    console.error('Get TMDB recommendations error:', error);
    return [];
  }
};

// Get genre-based recommendations
export const getGenreBasedRecommendations = async (userId, limit = 20) => {
  try {
    const genrePreferences = calculateGenrePreferences(userId);
    const topGenres = Object.keys(genrePreferences)
      .sort((a, b) => genrePreferences[b] - genrePreferences[a])
      .slice(0, 3);

    if (topGenres.length === 0) return [];

    // Get movies user has already seen
    const seenMovies = new Set();
    const userMovies = db.prepare(`
      SELECT tmdb_id FROM watchlist WHERE user_id = ?
      UNION
      SELECT tmdb_id FROM reviews WHERE user_id = ?
    `).all(userId, userId);
    userMovies.forEach(m => seenMovies.add(m.tmdb_id));

    const recommendations = [];

    // Fetch movies for top genres
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          with_genres: topGenres.join(','),
          sort_by: 'vote_average.desc',
          'vote_count.gte': 100,
          page: 1,
        },
      });

      response.data.results?.forEach(movie => {
        if (!seenMovies.has(movie.id) && recommendations.length < limit) {
          recommendations.push({
            movie_id: movie.id,
            score: movie.vote_average / 10,
            reason: `Matches your favorite genres`,
          });
        }
      });
    } catch (error) {
      console.error('Failed to fetch genre-based recommendations:', error);
    }

    return recommendations;
  } catch (error) {
    console.error('Get genre-based recommendations error:', error);
    return [];
  }
};

// Collaborative filtering recommendations
export const getCollaborativeRecommendations = (userId, limit = 20) => {
  try {
    const similarUsers = findSimilarUsers(userId, 10);
    if (similarUsers.length === 0) return [];

    // Get movies user has already seen
    const seenMovies = new Set();
    const userMovies = db.prepare(`
      SELECT tmdb_id FROM watchlist WHERE user_id = ?
      UNION
      SELECT tmdb_id FROM reviews WHERE user_id = ?
    `).all(userId, userId);
    userMovies.forEach(m => seenMovies.add(m.tmdb_id));

    // Get highly rated movies from similar users
    const userIds = similarUsers.map(u => u.user_id);
    const recommendations = db.prepare(`
      SELECT tmdb_id, AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews
      WHERE user_id IN (${userIds.join(',')}) AND rating >= 8
      GROUP BY tmdb_id
      ORDER BY avg_rating DESC, count DESC
      LIMIT ?
    `).all(limit * 2);

    return recommendations
      .filter(r => !seenMovies.has(r.tmdb_id))
      .slice(0, limit)
      .map(r => ({
        movie_id: r.tmdb_id,
        score: r.avg_rating / 10,
        reason: `Recommended by users with similar taste`,
      }));
  } catch (error) {
    console.error('Get collaborative recommendations error:', error);
    return [];
  }
};

// Hybrid recommendation engine
export const generateRecommendations = async (userId, limit = 20) => {
  try {
    const allRecommendations = new Map();

    // Get recommendations from different sources
    const [tmdb, genre, collaborative] = await Promise.all([
      getTMDBRecommendations(userId, limit),
      getGenreBasedRecommendations(userId, limit),
      Promise.resolve(getCollaborativeRecommendations(userId, limit)),
    ]);

    // Combine and weight recommendations
    const addRecommendation = (recs, weight) => {
      recs.forEach(rec => {
        const existing = allRecommendations.get(rec.movie_id);
        if (existing) {
          existing.score += rec.score * weight;
          existing.reasons.push(rec.reason);
        } else {
          allRecommendations.set(rec.movie_id, {
            movie_id: rec.movie_id,
            score: rec.score * weight,
            reasons: [rec.reason],
          });
        }
      });
    };

    addRecommendation(tmdb, 0.4);
    addRecommendation(genre, 0.3);
    addRecommendation(collaborative, 0.3);

    // Sort by score and return top recommendations
    const sortedRecommendations = Array.from(allRecommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache recommendations
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO recommendations_cache (user_id, movie_id, score, reason)
      VALUES (?, ?, ?, ?)
    `);

    sortedRecommendations.forEach(rec => {
      stmt.run(userId, rec.movie_id, rec.score, rec.reasons.join('; '));
    });

    return sortedRecommendations;
  } catch (error) {
    console.error('Generate recommendations error:', error);
    return [];
  }
};

// Get cached recommendations
export const getCachedRecommendations = (userId, limit = 20) => {
  try {
    const cached = db.prepare(`
      SELECT * FROM recommendations_cache
      WHERE user_id = ? AND created_at > datetime('now', '-24 hours')
      ORDER BY score DESC
      LIMIT ?
    `).all(userId, limit);

    return cached;
  } catch (error) {
    console.error('Get cached recommendations error:', error);
    return [];
  }
};
