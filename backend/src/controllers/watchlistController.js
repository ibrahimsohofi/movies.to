import db from '../config/database.js';
import { checkAchievements, updateGenrePreferences } from './userController.js';

// Get user's watchlist
export const getWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const watchlist = db.prepare(
      `SELECT w.id, w.created_at, m.*
       FROM watchlist w
       JOIN movies m ON w.movie_id = m.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`
    ).all(userId);

    res.json({ watchlist });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Failed to get watchlist' });
  }
};

// Add movie to watchlist
export const addToWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { movieData } = req.body;

    if (!movieData || !movieData.tmdb_id) {
      return res.status(400).json({ error: 'Movie data with tmdb_id is required' });
    }

    // Check if movie exists in our database
    let movie = db.prepare('SELECT id FROM movies WHERE tmdb_id = ?').get(movieData.tmdb_id);

    let movieId;

    if (!movie) {
      // Movie doesn't exist, create it
      const result = db.prepare(
        `INSERT INTO movies (tmdb_id, title, original_title, overview, release_date,
         runtime, vote_average, vote_count, popularity, poster_path, backdrop_path,
         original_language, status, tagline, imdb_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        movieData.tmdb_id,
        movieData.title,
        movieData.original_title || movieData.title,
        movieData.overview,
        movieData.release_date,
        movieData.runtime,
        movieData.vote_average,
        movieData.vote_count,
        movieData.popularity,
        movieData.poster_path,
        movieData.backdrop_path,
        movieData.original_language,
        movieData.status,
        movieData.tagline,
        movieData.imdb_id
      );
      movieId = result.lastInsertRowid;
    } else {
      movieId = movie.id;
    }

    // Check if already in watchlist
    const existing = db.prepare('SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?').get(userId, movieId);

    if (existing) {
      return res.status(409).json({ error: 'Movie already in watchlist' });
    }

    // Save movie genres if they were provided
    if (movieData.genres && Array.isArray(movieData.genres)) {
      for (const genre of movieData.genres) {
        // Find or get the genre by TMDB ID
        const dbGenre = db.prepare('SELECT id FROM genres WHERE tmdb_id = ?').get(genre.id);
        if (dbGenre) {
          // Check if genre is already linked to this movie
          const existing = db.prepare('SELECT * FROM movie_genres WHERE movie_id = ? AND genre_id = ?')
            .get(movieId, dbGenre.id);

          if (!existing) {
            db.prepare('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)')
              .run(movieId, dbGenre.id);
          }
        }
      }
    }

    // Add to watchlist
    db.prepare('INSERT INTO watchlist (user_id, movie_id) VALUES (?, ?)').run(userId, movieId);

    // Create activity
    db.prepare(
      `INSERT INTO activity_feed (user_id, activity_type, reference_id, reference_type)
       VALUES (?, 'watchlist_add', ?, 'movie')`
    ).run(userId, movieId);

    // Update genre preferences (with no rating)
    updateGenrePreferences(userId, movieId, null);

    // Check for achievements
    checkAchievements(userId);

    res.status(201).json({
      message: 'Movie added to watchlist',
      movieId
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
};

// Remove movie from watchlist
export const removeFromWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tmdb_id } = req.params;

    // Find movie
    const movie = db.prepare('SELECT id FROM movies WHERE tmdb_id = ?').get(tmdb_id);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const movieId = movie.id;

    // Remove from watchlist
    const result = db.prepare('DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?').run(userId, movieId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Movie not in watchlist' });
    }

    res.json({ message: 'Movie removed from watchlist' });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};

// Check if movie is in watchlist
export const checkWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tmdb_id } = req.params;

    const movie = db.prepare('SELECT id FROM movies WHERE tmdb_id = ?').get(tmdb_id);

    if (!movie) {
      return res.json({ inWatchlist: false });
    }

    const inWatchlist = db.prepare('SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?').get(userId, movie.id);

    res.json({ inWatchlist: !!inWatchlist });
  } catch (error) {
    console.error('Check watchlist error:', error);
    res.status(500).json({ error: 'Failed to check watchlist' });
  }
};
