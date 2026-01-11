import { query, execute, getConnection } from '../config/database.js';

class AnalyticsService {

  /**
   * Calculate comprehensive user statistics
   */
  async calculateUserStatistics(userId) {
    const connection = await getConnection();
    try {
      // Total movies watched (from view_history)
      const watchedCount = await query(`
        SELECT COUNT(DISTINCT movie_id) as count
        FROM view_history
        WHERE user_id = ?
      `, [userId]);

      // Total watch time (estimate based on viewed movies)
      const watchTime = await query(`
        SELECT COALESCE(SUM(m.runtime), 0) as total_minutes
        FROM view_history vh
        JOIN movies m ON vh.movie_id = m.id OR vh.tmdb_id = m.tmdb_id
        WHERE vh.user_id = ?
      `, [userId]);

      // Total reviews and average rating
      const reviewStats = await query(`
        SELECT
          COUNT(*) as review_count,
          AVG(rating) as avg_rating
        FROM reviews
        WHERE user_id = ?
      `, [userId]);

      // Watchlist count
      const watchlistCount = await query(`
        SELECT COUNT(*) as count
        FROM watchlist
        WHERE user_id = ?
      `, [userId]);

      // Favorite genre (most viewed)
      const favoriteGenre = await query(`
        SELECT
          g.name,
          COUNT(*) as count
        FROM view_history vh
        JOIN movies m ON vh.movie_id = m.id OR vh.tmdb_id = m.tmdb_id
        JOIN movie_genres mg ON m.id = mg.movie_id
        JOIN genres g ON mg.genre_id = g.id
        WHERE vh.user_id = ?
        GROUP BY g.id
        ORDER BY count DESC
        LIMIT 1
      `, [userId]);

      // Favorite decade
      const favoriteDecade = await query(`
        SELECT
          CONCAT(FLOOR(YEAR(m.release_date) / 10) * 10, 's') as decade,
          COUNT(*) as count
        FROM view_history vh
        JOIN movies m ON vh.movie_id = m.id OR vh.tmdb_id = m.tmdb_id
        WHERE vh.user_id = ? AND m.release_date IS NOT NULL
        GROUP BY decade
        ORDER BY count DESC
        LIMIT 1
      `, [userId]);

      // Most active year
      const mostActiveYear = await query(`
        SELECT
          YEAR(viewed_at) as year,
          COUNT(*) as count
        FROM view_history
        WHERE user_id = ? AND viewed_at IS NOT NULL
        GROUP BY year
        ORDER BY count DESC
        LIMIT 1
      `, [userId]);

      // Genre breakdown
      const genreBreakdown = await query(`
        SELECT
          g.id,
          g.name,
          COUNT(DISTINCT vh.movie_id) as movies_watched,
          COALESCE(AVG(r.rating), 0) as avg_rating
        FROM view_history vh
        JOIN movies m ON vh.movie_id = m.id OR vh.tmdb_id = m.tmdb_id
        JOIN movie_genres mg ON m.id = mg.movie_id
        JOIN genres g ON mg.genre_id = g.id
        LEFT JOIN reviews r ON vh.movie_id = r.movie_id AND r.user_id = vh.user_id
        WHERE vh.user_id = ?
        GROUP BY g.id
        ORDER BY movies_watched DESC
      `, [userId]);

      // Viewing patterns by day and hour
      const viewingPatterns = await query(`
        SELECT
          DAYOFWEEK(viewed_at) as day_of_week,
          HOUR(viewed_at) as hour_of_day,
          COUNT(*) as view_count
        FROM view_history
        WHERE user_id = ? AND viewed_at IS NOT NULL
        GROUP BY day_of_week, hour_of_day
        ORDER BY view_count DESC
      `, [userId]);

      // Rating distribution
      const ratingDistribution = await query(`
        SELECT
          rating,
          COUNT(*) as count
        FROM reviews
        WHERE user_id = ?
        GROUP BY rating
        ORDER BY rating
      `, [userId]);

      const statistics = {
        total_movies_watched: watchedCount[0]?.count || 0,
        total_watch_time_minutes: watchTime[0]?.total_minutes || 0,
        total_reviews: reviewStats[0]?.review_count || 0,
        avg_rating_given: parseFloat(reviewStats[0]?.avg_rating) || 0,
        watchlist_count: watchlistCount[0]?.count || 0,
        favorite_genre: favoriteGenre[0]?.name || null,
        favorite_decade: favoriteDecade[0]?.decade || null,
        most_active_year: mostActiveYear[0]?.year || null,
        genre_breakdown: genreBreakdown,
        viewing_patterns: viewingPatterns,
        rating_distribution: ratingDistribution
      };

      // Cache the statistics
      await execute(`
        INSERT INTO user_statistics
        (user_id, total_movies_watched, total_watch_time_minutes, total_reviews,
         avg_rating_given, favorite_genre, favorite_decade, most_watched_year, stats_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_movies_watched = VALUES(total_movies_watched),
          total_watch_time_minutes = VALUES(total_watch_time_minutes),
          total_reviews = VALUES(total_reviews),
          avg_rating_given = VALUES(avg_rating_given),
          favorite_genre = VALUES(favorite_genre),
          favorite_decade = VALUES(favorite_decade),
          most_watched_year = VALUES(most_watched_year),
          stats_json = VALUES(stats_json),
          last_calculated = CURRENT_TIMESTAMP
      `, [
        userId,
        statistics.total_movies_watched,
        statistics.total_watch_time_minutes,
        statistics.total_reviews,
        statistics.avg_rating_given,
        statistics.favorite_genre,
        statistics.favorite_decade,
        statistics.most_active_year,
        JSON.stringify(statistics)
      ]);

      return statistics;
    } finally {
      connection.release();
    }
  }

  /**
   * Get Year in Review for a user
   */
  async getYearInReview(userId, year) {
    // Basic stats for the year
    const yearStats = await query(`
      SELECT
        COUNT(DISTINCT vh.movie_id) as movies_watched,
        COALESCE(SUM(m.runtime), 0) as total_minutes,
        COUNT(DISTINCT DATE(vh.viewed_at)) as days_watched
      FROM view_history vh
      LEFT JOIN movies m ON vh.movie_id = m.id OR vh.tmdb_id = m.tmdb_id
      WHERE vh.user_id = ?
        AND YEAR(vh.viewed_at) = ?
    `, [userId, year]);

    // Average rating given this year
    const avgRating = await query(`
      SELECT AVG(rating) as avg_rating
      FROM reviews
      WHERE user_id = ? AND YEAR(created_at) = ?
    `, [userId, year]);

    // Top genres this year
    const topGenres = await query(`
      SELECT
        g.name,
        COUNT(*) as count
      FROM view_history vh
      JOIN movies m ON vh.movie_id = m.id OR vh.tmdb_id = m.tmdb_id
      JOIN movie_genres mg ON m.id = mg.movie_id
      JOIN genres g ON mg.genre_id = g.id
      WHERE vh.user_id = ?
        AND YEAR(vh.viewed_at) = ?
      GROUP BY g.id
      ORDER BY count DESC
      LIMIT 5
    `, [userId, year]);

    // Top rated movies this year
    const topMovies = await query(`
      SELECT
        m.tmdb_id,
        m.title,
        m.poster_path,
        r.rating
      FROM reviews r
      JOIN movies m ON r.movie_id = m.id OR r.tmdb_id = m.tmdb_id
      WHERE r.user_id = ?
        AND YEAR(r.created_at) = ?
      ORDER BY r.rating DESC, r.created_at DESC
      LIMIT 10
    `, [userId, year]);

    // Monthly breakdown
    const monthlyBreakdown = await query(`
      SELECT
        MONTH(viewed_at) as month,
        COUNT(*) as movies_watched
      FROM view_history
      WHERE user_id = ? AND YEAR(viewed_at) = ?
      GROUP BY month
      ORDER BY month
    `, [userId, year]);

    // Reviews written this year
    const reviewsWritten = await query(`
      SELECT COUNT(*) as count
      FROM reviews
      WHERE user_id = ? AND YEAR(created_at) = ?
    `, [userId, year]);

    // New genres explored
    const newGenres = await query(`
      SELECT DISTINCT g.name
      FROM view_history vh
      JOIN movies m ON vh.movie_id = m.id OR vh.tmdb_id = m.tmdb_id
      JOIN movie_genres mg ON m.id = mg.movie_id
      JOIN genres g ON mg.genre_id = g.id
      WHERE vh.user_id = ?
        AND YEAR(vh.viewed_at) = ?
        AND g.id NOT IN (
          SELECT DISTINCT g2.id
          FROM view_history vh2
          JOIN movies m2 ON vh2.movie_id = m2.id OR vh2.tmdb_id = m2.tmdb_id
          JOIN movie_genres mg2 ON m2.id = mg2.movie_id
          JOIN genres g2 ON mg2.genre_id = g2.id
          WHERE vh2.user_id = ? AND YEAR(vh2.viewed_at) < ?
        )
    `, [userId, year, userId, year]);

    return {
      year,
      movies_watched: yearStats[0]?.movies_watched || 0,
      total_hours: Math.round((yearStats[0]?.total_minutes || 0) / 60),
      days_watched: yearStats[0]?.days_watched || 0,
      avg_rating: parseFloat(avgRating[0]?.avg_rating) || 0,
      reviews_written: reviewsWritten[0]?.count || 0,
      top_genres: topGenres,
      top_movies: topMovies,
      monthly_breakdown: monthlyBreakdown,
      new_genres_explored: newGenres.map(g => g.name)
    };
  }

  /**
   * Get monthly viewing trends
   */
  async getMonthlyTrends(userId, months = 12) {
    const trends = await query(`
      SELECT
        DATE_FORMAT(vh.viewed_at, '%Y-%m') as month,
        COUNT(*) as movies_watched,
        COALESCE(SUM(m.runtime), 0) as total_minutes,
        COUNT(DISTINCT m.id) as unique_movies
      FROM view_history vh
      LEFT JOIN movies m ON vh.movie_id = m.id OR vh.tmdb_id = m.tmdb_id
      WHERE vh.user_id = ?
        AND vh.viewed_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY month
      ORDER BY month ASC
    `, [userId, months]);

    return trends;
  }

  /**
   * Get genre statistics for a user
   */
  async getGenreStats(userId) {
    const genreStats = await query(`
      SELECT
        g.id,
        g.name,
        COUNT(DISTINCT vh.movie_id) as movies_watched,
        COALESCE(SUM(m.runtime), 0) as total_runtime,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        MAX(vh.viewed_at) as last_watched
      FROM genres g
      LEFT JOIN movie_genres mg ON g.id = mg.genre_id
      LEFT JOIN movies m ON mg.movie_id = m.id
      LEFT JOIN view_history vh ON (m.id = vh.movie_id OR m.tmdb_id = vh.tmdb_id) AND vh.user_id = ?
      LEFT JOIN reviews r ON m.id = r.movie_id AND r.user_id = ?
      GROUP BY g.id
      HAVING movies_watched > 0
      ORDER BY movies_watched DESC
    `, [userId, userId]);

    return genreStats;
  }

  /**
   * Get comparison with other users
   */
  async getUserComparison(userId) {
    // Get user's stats
    const userStats = await this.calculateUserStatistics(userId);

    // Get average stats across all users
    const avgStats = await query(`
      SELECT
        AVG(total_movies_watched) as avg_movies,
        AVG(total_watch_time_minutes) as avg_watch_time,
        AVG(total_reviews) as avg_reviews,
        AVG(avg_rating_given) as avg_rating
      FROM user_statistics
    `);

    // Calculate percentiles
    const percentiles = await query(`
      SELECT
        (SELECT COUNT(*) FROM user_statistics WHERE total_movies_watched <= ?) * 100.0 /
        (SELECT COUNT(*) FROM user_statistics) as movies_percentile,
        (SELECT COUNT(*) FROM user_statistics WHERE total_reviews <= ?) * 100.0 /
        (SELECT COUNT(*) FROM user_statistics) as reviews_percentile
    `, [userStats.total_movies_watched, userStats.total_reviews]);

    return {
      user_stats: userStats,
      average_stats: avgStats[0],
      percentiles: percentiles[0]
    };
  }

  /**
   * Track viewing pattern
   */
  async trackViewingPattern(userId) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();

    await execute(`
      INSERT INTO viewing_patterns (user_id, day_of_week, hour_of_day, view_count)
      VALUES (?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE view_count = view_count + 1
    `, [userId, dayOfWeek, hourOfDay]);
  }
}

export default new AnalyticsService();
