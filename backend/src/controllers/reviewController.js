import db from '../config/database.js';
import { checkAchievements, updateGenrePreferences } from './userController.js';

// Ensure review_votes table exists (one upvote per user per review)
const ensureReviewVotesTable = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS review_votes (
      review_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (review_id, user_id),
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
};

// Ensure review_reports table exists
const ensureReviewReportsTable = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS review_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
};

// Get reviews for a movie
export const getMovieReviews = async (req, res) => {
  try {
    const { tmdb_id } = req.params;
    const {
      page = 1,
      limit = 20,
      search = '',
      minRating = 1,
      maxRating = 10,
      startDate = '',
      endDate = '',
      sortBy = 'recent'
    } = req.query;

    ensureReviewVotesTable();

    // Build dynamic WHERE clause
    let whereConditions = ['m.tmdb_id = ?'];
    let params = [tmdb_id];

    // Search in review text
    if (search) {
      whereConditions.push('r.review_text LIKE ?');
      params.push(`%${search}%`);
    }

    // Rating range filter
    if (minRating) {
      whereConditions.push('r.rating >= ?');
      params.push(parseInt(minRating));
    }
    if (maxRating) {
      whereConditions.push('r.rating <= ?');
      params.push(parseInt(maxRating));
    }

    // Date range filter
    if (startDate) {
      whereConditions.push('DATE(r.created_at) >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('DATE(r.created_at) <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Determine sort order
    let orderClause = 'ORDER BY r.created_at DESC';
    if (sortBy === 'helpful') {
      orderClause = 'ORDER BY helpful_count DESC, r.created_at DESC';
    } else if (sortBy === 'highest') {
      orderClause = 'ORDER BY r.rating DESC, r.created_at DESC';
    } else if (sortBy === 'lowest') {
      orderClause = 'ORDER BY r.rating ASC, r.created_at DESC';
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      JOIN movies m ON r.movie_id = m.id
      WHERE ${whereClause}
    `;
    const { total } = db.prepare(countQuery).get(...params);

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const reviews = db.prepare(
      `SELECT r.*, u.username, u.avatar_url,
              (SELECT COUNT(*) FROM review_votes rv WHERE rv.review_id = r.id) AS helpful_count
       FROM reviews r
       JOIN movies m ON r.movie_id = m.id
       JOIN users u ON r.user_id = u.id
       WHERE ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`
    ).all(...params);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: offset + reviews.length < total
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
};

// Add or update review
export const addReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tmdb_id } = req.params;
    const { rating, review_text } = req.body;

    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }

    // Get or create movie
    const movie = db.prepare('SELECT id FROM movies WHERE tmdb_id = ?').get(tmdb_id);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found. Add to watchlist first.' });
    }

    const movieId = movie.id;

    // Check if review exists
    const existing = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND movie_id = ?').get(userId, movieId);

    if (existing) {
      // Update existing review
      db.prepare('UPDATE reviews SET rating = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(rating, review_text, existing.id);

      // Update genre preferences
      updateGenrePreferences(userId, movieId, rating);

      res.json({ message: 'Review updated successfully' });
    } else {
      // Create new review
      const result = db.prepare('INSERT INTO reviews (user_id, movie_id, rating, review_text) VALUES (?, ?, ?, ?)')
        .run(userId, movieId, rating, review_text);

      // Create activity
      db.prepare(
        `INSERT INTO activity_feed (user_id, activity_type, reference_id, reference_type)
         VALUES (?, 'review', ?, 'review')`
      ).run(userId, result.lastInsertRowid);

      // Update genre preferences
      updateGenrePreferences(userId, movieId, rating);

      // Check for achievements
      checkAchievements(userId);

      res.status(201).json({ message: 'Review added successfully' });
    }
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
};

// Update review by id
export const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { rating, review_text } = req.body;

    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }

    const result = db
      .prepare('UPDATE reviews SET rating = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
      .run(rating, review_text, reviewId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;

    const result = db.prepare('DELETE FROM reviews WHERE id = ? AND user_id = ?').run(reviewId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

// Get user's review for a movie
export const getUserReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tmdb_id } = req.params;

    const review = db.prepare(
      `SELECT r.*
       FROM reviews r
       JOIN movies m ON r.movie_id = m.id
       WHERE r.user_id = ? AND m.tmdb_id = ?`
    ).get(userId, tmdb_id);

    res.json({ review: review || null });
  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({ error: 'Failed to get review' });
  }
};

// Get all reviews by current user
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = db.prepare(
      `SELECT r.*, m.tmdb_id, m.title
       FROM reviews r
       JOIN movies m ON r.movie_id = m.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`
    ).all(userId);

    res.json({ reviews });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ error: 'Failed to get user reviews' });
  }
};

// Vote a review as helpful (up) or remove vote (down)
export const voteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { voteType } = req.body;

    ensureReviewVotesTable();

    const review = db.prepare('SELECT id FROM reviews WHERE id = ?').get(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (voteType === 'up') {
      // Insert or keep existing upvote
      db.prepare('INSERT OR IGNORE INTO review_votes (review_id, user_id) VALUES (?, ?)').run(reviewId, userId);
    } else if (voteType === 'down') {
      // Remove existing upvote if exists
      db.prepare('DELETE FROM review_votes WHERE review_id = ? AND user_id = ?').run(reviewId, userId);
    } else {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    const helpful = db
      .prepare('SELECT COUNT(*) as cnt FROM review_votes WHERE review_id = ?')
      .get(reviewId);

    res.json({ message: 'Vote recorded', helpful_count: helpful.cnt });
  } catch (error) {
    console.error('Vote review error:', error);
    res.status(500).json({ error: 'Failed to vote on review' });
  }
};

// Get movie average rating
export const getMovieRating = async (req, res) => {
  try {
    const { tmdb_id } = req.params;

    const result = db.prepare(
      `SELECT
         AVG(r.rating) as average_rating,
         COUNT(r.id) as review_count
       FROM reviews r
       JOIN movies m ON r.movie_id = m.id
       WHERE m.tmdb_id = ?`
    ).get(tmdb_id);

    res.json({
      averageRating: result?.average_rating ? parseFloat(result.average_rating).toFixed(1) : null,
      reviewCount: result?.review_count || 0
    });
  } catch (error) {
    console.error('Get movie rating error:', error);
    res.status(500).json({ error: 'Failed to get rating' });
  }
};

// Report a review
export const reportReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    ensureReviewReportsTable();

    const review = db.prepare('SELECT id FROM reviews WHERE id = ?').get(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user already reported this review
    const existingReport = db.prepare(
      'SELECT id FROM review_reports WHERE review_id = ? AND user_id = ?'
    ).get(reviewId, userId);

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this review' });
    }

    db.prepare(
      'INSERT INTO review_reports (review_id, user_id, reason, description) VALUES (?, ?, ?, ?)'
    ).run(reviewId, userId, reason, description || null);

    res.json({ message: 'Review reported successfully' });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({ error: 'Failed to report review' });
  }
};

// Get all reports (admin only)
export const getAllReports = async (req, res) => {
  try {
    // Check if user is admin (you should have a role check)
    ensureReviewReportsTable();

    const reports = db.prepare(`
      SELECT rr.*, r.review_text, r.rating,
             u1.username as reporter_username,
             u2.username as review_author_username
      FROM review_reports rr
      JOIN reviews r ON rr.review_id = r.id
      JOIN users u1 ON rr.user_id = u1.id
      JOIN users u2 ON r.user_id = u2.id
      ORDER BY rr.created_at DESC
    `).all();

    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
};

// Update report status (admin only)
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    ensureReviewReportsTable();

    const result = db.prepare(
      'UPDATE review_reports SET status = ? WHERE id = ?'
    ).run(status, reportId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report status updated successfully' });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
};
