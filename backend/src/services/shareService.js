import { query, execute } from '../config/database.js';

class ShareService {

  /**
   * Track a share event
   */
  async trackShare(userId, contentType, contentId, platform) {
    await execute(`
      INSERT INTO share_tracking (user_id, content_type, content_id, platform)
      VALUES (?, ?, ?, ?)
    `, [userId, contentType, contentId, platform]);
  }

  /**
   * Generate a shareable link
   */
  generateShareableLink(contentType, contentId) {
    const baseUrl = process.env.FRONTEND_URL || 'https://movies.to';

    const paths = {
      movie: `/movie/${contentId}`,
      list: `/lists/${contentId}`,
      review: `/movie/${contentId}#reviews`,
      watchlist: `/profile/${contentId}/watchlist`,
      year_review: `/profile/${contentId}/year-review`,
      profile: `/profile/${contentId}`
    };

    return `${baseUrl}${paths[contentType] || '/'}`;
  }

  /**
   * Get share metadata for Open Graph tags
   */
  async getShareMetadata(contentType, contentId) {
    let metadata = {};

    switch (contentType) {
      case 'movie':
        const movie = await query(`
          SELECT title, overview, poster_path, vote_average
          FROM movies
          WHERE tmdb_id = ? OR id = ?
        `, [contentId, contentId]);

        if (movie[0]) {
          metadata = {
            title: movie[0].title,
            description: movie[0].overview?.substring(0, 200) + '...',
            image: movie[0].poster_path
              ? `https://image.tmdb.org/t/p/w500${movie[0].poster_path}`
              : null,
            rating: movie[0].vote_average,
            type: 'movie'
          };
        }
        break;

      case 'list':
        const list = await query(`
          SELECT l.name, l.description, u.username,
                 COUNT(li.id) as movie_count
          FROM lists l
          JOIN users u ON l.user_id = u.id
          LEFT JOIN list_items li ON l.id = li.list_id
          WHERE l.id = ?
          GROUP BY l.id
        `, [contentId]);

        if (list[0]) {
          metadata = {
            title: list[0].name,
            description: list[0].description || `A movie list by ${list[0].username}`,
            author: list[0].username,
            movieCount: list[0].movie_count,
            type: 'list'
          };
        }
        break;

      case 'review':
        const review = await query(`
          SELECT r.review_text, r.rating, m.title, m.poster_path, u.username
          FROM reviews r
          JOIN movies m ON r.movie_id = m.id OR r.tmdb_id = m.tmdb_id
          JOIN users u ON r.user_id = u.id
          WHERE r.id = ?
        `, [contentId]);

        if (review[0]) {
          metadata = {
            title: `${review[0].username}'s review of ${review[0].title}`,
            description: review[0].review_text?.substring(0, 200) + '...',
            rating: review[0].rating,
            image: review[0].poster_path
              ? `https://image.tmdb.org/t/p/w500${review[0].poster_path}`
              : null,
            type: 'review'
          };
        }
        break;

      case 'profile':
        const profile = await query(`
          SELECT u.username, u.avatar_url,
                 (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as review_count,
                 (SELECT COUNT(*) FROM watchlist WHERE user_id = u.id) as watchlist_count
          FROM users u
          WHERE u.id = ?
        `, [contentId]);

        if (profile[0]) {
          metadata = {
            title: `${profile[0].username}'s Profile`,
            description: `${profile[0].review_count} reviews, ${profile[0].watchlist_count} movies in watchlist`,
            image: profile[0].avatar_url,
            type: 'profile'
          };
        }
        break;

      case 'year_review':
        const user = await query(`
          SELECT username FROM users WHERE id = ?
        `, [contentId]);

        if (user[0]) {
          const year = new Date().getFullYear();
          metadata = {
            title: `${user[0].username}'s ${year} Year in Movies`,
            description: `Check out ${user[0].username}'s movie watching journey this year!`,
            type: 'year_review'
          };
        }
        break;
    }

    return metadata;
  }

  /**
   * Get share statistics for a user
   */
  async getUserShareStats(userId) {
    const stats = await query(`
      SELECT
        content_type,
        platform,
        COUNT(*) as share_count
      FROM share_tracking
      WHERE user_id = ?
      GROUP BY content_type, platform
      ORDER BY share_count DESC
    `, [userId]);

    const totalShares = await query(`
      SELECT COUNT(*) as total FROM share_tracking WHERE user_id = ?
    `, [userId]);

    return {
      total_shares: totalShares[0]?.total || 0,
      breakdown: stats
    };
  }

  /**
   * Get popular shared content
   */
  async getPopularSharedContent(contentType, limit = 10) {
    const popular = await query(`
      SELECT
        content_id,
        COUNT(*) as share_count
      FROM share_tracking
      WHERE content_type = ?
      GROUP BY content_id
      ORDER BY share_count DESC
      LIMIT ?
    `, [contentType, limit]);

    return popular;
  }

  /**
   * Generate social share text
   */
  generateShareText(contentType, metadata, platform) {
    const hashtags = '#Movies #MovieRecommendation #MoviesToDo';

    switch (contentType) {
      case 'movie':
        if (platform === 'twitter') {
          return `Check out "${metadata.title}" - rated ${metadata.rating}/10 on Movies.to! ${hashtags}`;
        }
        return `I just discovered "${metadata.title}" on Movies.to! Rating: ${metadata.rating}/10`;

      case 'list':
        return `Check out this movie list: "${metadata.title}" by ${metadata.author} - ${metadata.movieCount} movies!`;

      case 'review':
        return `${metadata.title} - "${metadata.description?.substring(0, 100)}..."`;

      case 'year_review':
        return `Check out my ${metadata.year || new Date().getFullYear()} Year in Movies!`;

      default:
        return 'Check this out on Movies.to!';
    }
  }
}

export default new ShareService();
