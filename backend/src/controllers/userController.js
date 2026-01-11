import db from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search users by username
export const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }

    const users = db.prepare(
      `SELECT id, username, avatar_url, bio
       FROM users
       WHERE username LIKE ?
       ORDER BY username ASC
       LIMIT ?`
    ).all(`%${q}%`, parseInt(limit));

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// Get user by username
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = db.prepare(
      `SELECT id, username, avatar_url, bio, created_at
       FROM users
       WHERE username = ?`
    ).get(username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user stats
    const stats = getUserStats(user.id);

    // Check if current user follows this user
    let isFollowing = false;
    if (req.user) {
      const follow = db.prepare(
        'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?'
      ).get(req.user.id, user.id);
      isFollowing = !!follow;
    }

    res.json({ user: { ...user, stats, isFollowing } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Get current user profile with stats
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = db.prepare(
      `SELECT id, username, email, avatar_url, bio, created_at
       FROM users
       WHERE id = ?`
    ).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get comprehensive stats
    const stats = getUserStats(userId);

    // Get genre preferences
    const genrePreferences = getGenrePreferences(userId);

    res.json({
      user: {
        ...user,
        stats,
        genrePreferences
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Helper function to get user stats
function getUserStats(userId) {
  const watchlistCount = db.prepare(
    'SELECT COUNT(*) as count FROM watchlist WHERE user_id = ?'
  ).get(userId).count;

  const reviewCount = db.prepare(
    'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?'
  ).get(userId).count;

  const commentCount = db.prepare(
    'SELECT COUNT(*) as count FROM comments WHERE user_id = ?'
  ).get(userId).count;

  const viewCount = db.prepare(
    'SELECT COUNT(DISTINCT movie_id) as count FROM view_history WHERE user_id = ?'
  ).get(userId).count;

  const followerCount = db.prepare(
    'SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?'
  ).get(userId).count;

  const followingCount = db.prepare(
    'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?'
  ).get(userId).count;

  const totalPoints = db.prepare(
    `SELECT COALESCE(SUM(a.points), 0) as points
     FROM user_achievements ua
     JOIN achievements a ON ua.achievement_id = a.id
     WHERE ua.user_id = ? AND ua.unlocked = 1`
  ).get(userId).points;

  const unlockedAchievements = db.prepare(
    'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ? AND unlocked = 1'
  ).get(userId).count;

  return {
    watchlistCount,
    reviewCount,
    commentCount,
    viewCount,
    followerCount,
    followingCount,
    totalPoints,
    unlockedAchievements
  };
}

// Helper function to get genre preferences
function getGenrePreferences(userId) {
  const preferences = db.prepare(
    `SELECT gp.*, g.name, g.slug
     FROM genre_preferences gp
     JOIN genres g ON gp.genre_id = g.id
     WHERE gp.user_id = ?
     ORDER BY gp.preference_score DESC
     LIMIT 5`
  ).all(userId);

  return preferences;
}

// Get user activity feed
export const getActivityFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const activities = db.prepare(
      `SELECT
        af.*,
        CASE
          WHEN af.activity_type = 'review' THEN (
            SELECT json_object(
              'id', r.id,
              'rating', r.rating,
              'review_text', r.review_text,
              'movie', (
                SELECT json_object('id', m.id, 'title', m.title, 'poster_path', m.poster_path)
                FROM movies m WHERE m.id = r.movie_id
              )
            )
            FROM reviews r WHERE r.id = af.reference_id
          )
          WHEN af.activity_type = 'watchlist_add' THEN (
            SELECT json_object(
              'id', m.id,
              'title', m.title,
              'poster_path', m.poster_path
            )
            FROM movies m WHERE m.id = af.reference_id
          )
          WHEN af.activity_type = 'follow' THEN (
            SELECT json_object(
              'id', u.id,
              'username', u.username,
              'avatar_url', u.avatar_url
            )
            FROM users u WHERE u.id = af.reference_id
          )
          WHEN af.activity_type = 'achievement' THEN (
            SELECT json_object(
              'id', a.id,
              'name', a.name,
              'description', a.description,
              'icon', a.icon,
              'points', a.points
            )
            FROM achievements a WHERE a.id = af.reference_id
          )
        END as data
       FROM activity_feed af
       WHERE af.user_id = ?
       ORDER BY af.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(userId, parseInt(limit), parseInt(offset));

    const totalCount = db.prepare(
      'SELECT COUNT(*) as count FROM activity_feed WHERE user_id = ?'
    ).get(userId).count;

    res.json({
      activities: activities.map(a => ({
        ...a,
        data: a.data ? JSON.parse(a.data) : null
      })),
      total: totalCount
    });
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ error: 'Failed to get activity feed' });
  }
};

// Follow a user
export const followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { userId } = req.params;

    if (followerId === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existing = db.prepare(
      'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?'
    ).get(followerId, userId);

    if (existing) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow
    db.prepare(
      'INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)'
    ).run(followerId, userId);

    // Create activity
    createActivity(followerId, 'follow', userId, 'user');

    // Create notification for followed user
    const follower = db.prepare('SELECT username FROM users WHERE id = ?').get(followerId);
    createNotification(
      parseInt(userId),
      'follow',
      'New Follower',
      `${follower.username} started following you`,
      `/profile/${follower.username}`
    );

    // Check for achievements
    checkAchievements(followerId);

    res.json({ success: true });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { userId } = req.params;

    db.prepare(
      'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?'
    ).run(followerId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

// Get user followers
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const followers = db.prepare(
      `SELECT u.id, u.username, u.avatar_url, u.bio
       FROM user_follows uf
       JOIN users u ON uf.follower_id = u.id
       WHERE uf.following_id = ?
       ORDER BY uf.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(userId, parseInt(limit), parseInt(offset));

    const totalCount = db.prepare(
      'SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?'
    ).get(userId).count;

    res.json({ followers, total: totalCount });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
};

// Get user following
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const following = db.prepare(
      `SELECT u.id, u.username, u.avatar_url, u.bio
       FROM user_follows uf
       JOIN users u ON uf.following_id = u.id
       WHERE uf.follower_id = ?
       ORDER BY uf.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(userId, parseInt(limit), parseInt(offset));

    const totalCount = db.prepare(
      'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?'
    ).get(userId).count;

    res.json({ following, total: totalCount });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to get following' });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar } = req.body; // Base64 image data

    if (!avatar) {
      return res.status(400).json({ error: 'No avatar provided' });
    }

    // Extract base64 data
    const matches = avatar.match(/^data:image\/([a-z]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const [, extension, data] = matches;
    const buffer = Buffer.from(data, 'base64');

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const filename = `${userId}-${Date.now()}.${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file
    fs.writeFileSync(filepath, buffer);

    // Update user avatar_url
    const avatarUrl = `/uploads/avatars/${filename}`;
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, userId);

    res.json({ avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

// Get user achievements
export const getUserAchievements = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const achievements = db.prepare(
      `SELECT
        a.*,
        ua.progress,
        ua.unlocked,
        ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
       ORDER BY ua.unlocked DESC, a.category, a.points DESC`
    ).all(userId);

    // Calculate completion percentage
    const totalAchievements = achievements.length;
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const completionPercentage = totalAchievements > 0
      ? Math.round((unlockedCount / totalAchievements) * 100)
      : 0;

    res.json({
      achievements,
      stats: {
        total: totalAchievements,
        unlocked: unlockedCount,
        completionPercentage
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
};

// Helper function to create activity
function createActivity(userId, activityType, referenceId, referenceType, metadata = null) {
  db.prepare(
    `INSERT INTO activity_feed (user_id, activity_type, reference_id, reference_type, metadata)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, activityType, referenceId, referenceType, metadata ? JSON.stringify(metadata) : null);
}

// Helper function to create notification
function createNotification(userId, type, title, message, link = null) {
  db.prepare(
    `INSERT INTO notifications (user_id, type, title, message, link)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, type, title, message, link);
}

// Helper function to check and unlock achievements
export function checkAchievements(userId) {
  const stats = getUserStats(userId);

  const achievementChecks = [
    { type: 'view_count', value: stats.viewCount },
    { type: 'review_count', value: stats.reviewCount },
    { type: 'watchlist_count', value: stats.watchlistCount },
    { type: 'following_count', value: stats.followingCount },
    { type: 'follower_count', value: stats.followerCount }
  ];

  for (const check of achievementChecks) {
    const achievements = db.prepare(
      'SELECT * FROM achievements WHERE requirement_type = ?'
    ).all(check.type);

    for (const achievement of achievements) {
      // Check if user has this achievement
      let userAchievement = db.prepare(
        'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
      ).get(userId, achievement.id);

      if (!userAchievement) {
        // Create new achievement entry
        db.prepare(
          'INSERT INTO user_achievements (user_id, achievement_id, progress) VALUES (?, ?, ?)'
        ).run(userId, achievement.id, 0);

        userAchievement = db.prepare(
          'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
        ).get(userId, achievement.id);
      }

      // Update progress
      const newProgress = Math.min(check.value, achievement.requirement_value);

      if (!userAchievement.unlocked && newProgress >= achievement.requirement_value) {
        // Unlock achievement
        db.prepare(
          'UPDATE user_achievements SET progress = ?, unlocked = 1, unlocked_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(newProgress, userAchievement.id);

        // Create activity
        createActivity(userId, 'achievement', achievement.id, 'achievement');

        // Create notification
        createNotification(
          userId,
          'achievement',
          'Achievement Unlocked!',
          `You unlocked "${achievement.name}" (+${achievement.points} points)`,
          '/profile/achievements'
        );
      } else if (!userAchievement.unlocked) {
        // Update progress only
        db.prepare(
          'UPDATE user_achievements SET progress = ? WHERE id = ?'
        ).run(newProgress, userAchievement.id);
      }
    }
  }

  // Check genre diversity achievement
  const genreCount = db.prepare(
    `SELECT COUNT(DISTINCT g.id) as count
     FROM view_history vh
     JOIN movies m ON vh.movie_id = m.id
     JOIN movie_genres mg ON m.id = mg.movie_id
     JOIN genres g ON mg.genre_id = g.id
     WHERE vh.user_id = ?`
  ).get(userId).count;

  const genreAchievements = db.prepare(
    'SELECT * FROM achievements WHERE requirement_type = ?'
  ).all('genre_count');

  for (const achievement of genreAchievements) {
    let userAchievement = db.prepare(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
    ).get(userId, achievement.id);

    if (!userAchievement) {
      db.prepare(
        'INSERT INTO user_achievements (user_id, achievement_id, progress) VALUES (?, ?, ?)'
      ).run(userId, achievement.id, 0);

      userAchievement = db.prepare(
        'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
      ).get(userId, achievement.id);
    }

    const newProgress = Math.min(genreCount, achievement.requirement_value);

    if (!userAchievement.unlocked && newProgress >= achievement.requirement_value) {
      db.prepare(
        'UPDATE user_achievements SET progress = ?, unlocked = 1, unlocked_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(newProgress, userAchievement.id);

      createActivity(userId, 'achievement', achievement.id, 'achievement');
      createNotification(
        userId,
        'achievement',
        'Achievement Unlocked!',
        `You unlocked "${achievement.name}" (+${achievement.points} points)`,
        '/profile/achievements'
      );
    } else if (!userAchievement.unlocked) {
      db.prepare(
        'UPDATE user_achievements SET progress = ? WHERE id = ?'
      ).run(newProgress, userAchievement.id);
    }
  }
}

// Track movie view
export const trackMovieView = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { tmdb_id } = req.params;
    const { movieData } = req.body;

    if (!userId) {
      // Allow tracking without user ID for analytics
      return res.json({ success: true });
    }

    // Get or create movie
    let movie = db.prepare('SELECT id FROM movies WHERE tmdb_id = ?').get(tmdb_id);

    let movieId;
    if (!movie && movieData) {
      // Create movie if it doesn't exist
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

      // Save genres if provided
      if (movieData.genres && Array.isArray(movieData.genres)) {
        for (const genre of movieData.genres) {
          const dbGenre = db.prepare('SELECT id FROM genres WHERE tmdb_id = ?').get(genre.id);
          if (dbGenre) {
            const existing = db.prepare('SELECT * FROM movie_genres WHERE movie_id = ? AND genre_id = ?')
              .get(movieId, dbGenre.id);

            if (!existing) {
              db.prepare('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)')
                .run(movieId, dbGenre.id);
            }
          }
        }
      }
    } else if (movie) {
      movieId = movie.id;
    } else {
      return res.status(404).json({ error: 'Movie not found and no data provided' });
    }

    // Add to view history
    db.prepare('INSERT INTO view_history (user_id, movie_id) VALUES (?, ?)').run(userId, movieId);

    // Update genre preferences (with no rating for views)
    updateGenrePreferences(userId, movieId, null);

    // Check for achievements
    checkAchievements(userId);

    res.json({ success: true, movieId });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
};

// Update genre preferences based on user activity
export function updateGenrePreferences(userId, movieId, rating = null) {
  // Get movie genres
  const genres = db.prepare(
    `SELECT g.id
     FROM movie_genres mg
     JOIN genres g ON mg.genre_id = g.id
     WHERE mg.movie_id = ?`
  ).all(movieId);

  for (const genre of genres) {
    let preference = db.prepare(
      'SELECT * FROM genre_preferences WHERE user_id = ? AND genre_id = ?'
    ).get(userId, genre.id);

    if (!preference) {
      // Create new preference
      db.prepare(
        'INSERT INTO genre_preferences (user_id, genre_id, view_count, rating_sum, rating_count) VALUES (?, ?, 1, ?, ?)'
      ).run(userId, genre.id, rating || 0, rating ? 1 : 0);
    } else {
      // Update existing preference
      const newViewCount = preference.view_count + 1;
      const newRatingSum = preference.rating_sum + (rating || 0);
      const newRatingCount = preference.rating_count + (rating ? 1 : 0);

      // Calculate preference score (weighted average)
      const avgRating = newRatingCount > 0 ? newRatingSum / newRatingCount : 0;
      const viewWeight = Math.min(newViewCount / 10, 1); // Max weight at 10 views
      const ratingWeight = avgRating / 10; // Normalized to 0-1
      const preferenceScore = (viewWeight * 0.4 + ratingWeight * 0.6) * 100;

      db.prepare(
        `UPDATE genre_preferences
         SET view_count = ?, rating_sum = ?, rating_count = ?, preference_score = ?, last_updated = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(newViewCount, newRatingSum, newRatingCount, preferenceScore, preference.id);
    }
  }
}
