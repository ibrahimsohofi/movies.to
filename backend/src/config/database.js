import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

// MySQL connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movies_to',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create MySQL connection pool
let pool;

try {
  pool = mysql.createPool(poolConfig);
  console.log('MySQL connection pool created');
} catch (error) {
  console.error('Failed to create MySQL connection pool:', error.message);
  process.exit(1);
}

// Initialize database schema
async function initializeDatabase() {
  const connection = await pool.getConnection();

  try {
    // Users Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        avatar_url TEXT,
        oauth_provider VARCHAR(50),
        oauth_id VARCHAR(255),
        email_verified TINYINT(1) DEFAULT 0,
        email_verification_token VARCHAR(255),
        email_verification_expires DATETIME,
        password_reset_token VARCHAR(255),
        password_reset_expires DATETIME,
        is_premium TINYINT(1) DEFAULT 0,
        premium_since DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Genres Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS genres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tmdb_id INT UNIQUE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Movies Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS movies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tmdb_id INT UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        original_title VARCHAR(500),
        overview TEXT,
        release_date DATE,
        runtime INT,
        vote_average DECIMAL(3,1),
        vote_count INT,
        popularity DECIMAL(10,3),
        poster_path VARCHAR(255),
        backdrop_path VARCHAR(255),
        original_language VARCHAR(10),
        status VARCHAR(50),
        tagline TEXT,
        budget BIGINT,
        revenue BIGINT,
        imdb_id VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tmdb_id (tmdb_id),
        INDEX idx_release_date (release_date),
        INDEX idx_popularity (popularity)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Movie_Genres Junction Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS movie_genres (
        movie_id INT NOT NULL,
        genre_id INT NOT NULL,
        PRIMARY KEY (movie_id, genre_id),
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Watchlist Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        movie_id INT NOT NULL,
        tmdb_id INT,
        title VARCHAR(500),
        poster_path VARCHAR(255),
        vote_average DECIMAL(3,1),
        release_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_movie (user_id, movie_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Reviews Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        movie_id INT NOT NULL,
        tmdb_id INT,
        rating TINYINT CHECK (rating >= 1 AND rating <= 10),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_movie_review (user_id, movie_id),
        INDEX idx_movie_id (movie_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Comments Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        movie_id INT NOT NULL,
        tmdb_id INT,
        parent_id INT,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
        INDEX idx_movie_id (movie_id),
        INDEX idx_parent_id (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // View History Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS view_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        movie_id INT NOT NULL,
        tmdb_id INT,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_viewed_at (viewed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Torrents Cache Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS torrents_cache (
        imdb_id VARCHAR(20) PRIMARY KEY,
        data_json JSON NOT NULL,
        cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // User Follows Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_follow (follower_id, following_id),
        INDEX idx_follower (follower_id),
        INDEX idx_following (following_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Lists Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_public TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_is_public (is_public)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // List Items Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS list_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        list_id INT NOT NULL,
        movie_id INT NOT NULL,
        tmdb_id INT,
        position INT DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
        UNIQUE KEY unique_list_movie (list_id, movie_id),
        INDEX idx_list_id (list_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Notifications Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        link VARCHAR(500),
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Activity Feed Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_feed (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        reference_id INT,
        reference_type VARCHAR(50),
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Recommendations Cache Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recommendations_cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        movie_id INT NOT NULL,
        score DECIMAL(5,4) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_movie_rec (user_id, movie_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Quizzes Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        category VARCHAR(100) DEFAULT 'general',
        created_by INT,
        is_published TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_is_published (is_published)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Quiz Questions Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        question_text TEXT NOT NULL,
        image_url VARCHAR(500),
        points INT DEFAULT 10,
        type ENUM('multiple_choice', 'true_false', 'text') DEFAULT 'multiple_choice',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        INDEX idx_quiz_id (quiz_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Quiz Answers Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quiz_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        answer_text TEXT NOT NULL,
        is_correct TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
        INDEX idx_question_id (question_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Quiz Results Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        quiz_id INT NOT NULL,
        score INT DEFAULT 0,
        max_possible_score INT DEFAULT 0,
        completion_time INT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_quiz_id (quiz_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Achievements Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        points INT DEFAULT 0,
        requirement_type VARCHAR(50) NOT NULL,
        requirement_value INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // User Achievements Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        achievement_id INT NOT NULL,
        progress INT DEFAULT 0,
        unlocked TINYINT(1) DEFAULT 0,
        unlocked_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_achievement (user_id, achievement_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Subscriptions Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        plan_id VARCHAR(100) NOT NULL,
        status ENUM('active', 'cancelled', 'expired', 'trial', 'past_due') NOT NULL,
        current_period_start DATETIME,
        current_period_end DATETIME,
        cancel_at_period_end TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Feature Usage Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS feature_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        feature_type VARCHAR(100) NOT NULL,
        usage_count INT DEFAULT 0,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        UNIQUE KEY unique_user_feature (user_id, feature_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ==========================================
    // ENHANCEMENT TABLES - Analytics, Sharing, Watch Party
    // ==========================================

    // User Statistics Table (for caching analytics)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_statistics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_movies_watched INT DEFAULT 0,
        total_watch_time_minutes INT DEFAULT 0,
        total_reviews INT DEFAULT 0,
        avg_rating_given DECIMAL(3,2),
        favorite_genre VARCHAR(100),
        favorite_decade VARCHAR(20),
        favorite_actor VARCHAR(255),
        favorite_director VARCHAR(255),
        most_watched_year INT,
        stats_json JSON,
        last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Viewing Patterns Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS viewing_patterns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        day_of_week TINYINT,
        hour_of_day TINYINT,
        view_count INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_pattern (user_id, day_of_week, hour_of_day)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // User Genre Stats Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_genre_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        genre_id INT NOT NULL,
        movies_watched INT DEFAULT 0,
        total_runtime_minutes INT DEFAULT 0,
        avg_rating DECIMAL(3,2),
        last_watched TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_genre (user_id, genre_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Share Tracking Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS share_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        content_type ENUM('movie', 'list', 'review', 'watchlist', 'year_review', 'profile') NOT NULL,
        content_id INT NOT NULL,
        platform ENUM('twitter', 'facebook', 'instagram', 'linkedin', 'whatsapp', 'copy_link', 'native') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_content (user_id, content_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Watch Parties Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS watch_parties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        host_user_id INT NOT NULL,
        movie_id INT NOT NULL,
        party_code VARCHAR(20) UNIQUE NOT NULL,
        title VARCHAR(255),
        status ENUM('waiting', 'active', 'paused', 'ended') DEFAULT 'waiting',
        max_participants INT DEFAULT 10,
        is_public TINYINT(1) DEFAULT 0,
        scheduled_time TIMESTAMP NULL,
        started_at TIMESTAMP NULL,
        ended_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_party_code (party_code),
        INDEX idx_status (status),
        INDEX idx_host (host_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Watch Party Participants Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS watch_party_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        party_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP NULL,
        is_active TINYINT(1) DEFAULT 1,
        FOREIGN KEY (party_id) REFERENCES watch_parties(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_party_user (party_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Watch Party Messages Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS watch_party_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        party_id INT NOT NULL,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        message_type ENUM('chat', 'system', 'reaction') DEFAULT 'chat',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (party_id) REFERENCES watch_parties(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_party_time (party_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Watch Party Playback State Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS watch_party_playback_state (
        id INT AUTO_INCREMENT PRIMARY KEY,
        party_id INT NOT NULL UNIQUE,
        current_time DECIMAL(10,2) DEFAULT 0,
        is_playing TINYINT(1) DEFAULT 0,
        updated_by INT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (party_id) REFERENCES watch_parties(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add watched column to watchlist if not exists
    try {
      await connection.execute(`
        ALTER TABLE watchlist
        ADD COLUMN IF NOT EXISTS watched TINYINT(1) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS watched_at TIMESTAMP NULL
      `);
    } catch (e) {
      // Column might already exist
    }

    // Insert default genres (if they don't exist)
    const genres = [
      [28, 'Action', 'action'],
      [12, 'Adventure', 'adventure'],
      [16, 'Animation', 'animation'],
      [35, 'Comedy', 'comedy'],
      [80, 'Crime', 'crime'],
      [99, 'Documentary', 'documentary'],
      [18, 'Drama', 'drama'],
      [10751, 'Family', 'family'],
      [14, 'Fantasy', 'fantasy'],
      [36, 'History', 'history'],
      [27, 'Horror', 'horror'],
      [10402, 'Music', 'music'],
      [9648, 'Mystery', 'mystery'],
      [10749, 'Romance', 'romance'],
      [878, 'Science Fiction', 'science-fiction'],
      [10770, 'TV Movie', 'tv-movie'],
      [53, 'Thriller', 'thriller'],
      [10752, 'War', 'war'],
      [37, 'Western', 'western']
    ];

    for (const [tmdb_id, name, slug] of genres) {
      await connection.execute(
        'INSERT IGNORE INTO genres (tmdb_id, name, slug) VALUES (?, ?, ?)',
        [tmdb_id, name, slug]
      );
    }

    // Insert default achievements (if they don't exist)
    const achievements = [
      ['First Steps', 'Watch your first movie', 'Play', 'viewing', 10, 'view_count', 1],
      ['Movie Buff', 'Watch 10 movies', 'Film', 'viewing', 25, 'view_count', 10],
      ['Cinema Addict', 'Watch 50 movies', 'Clapperboard', 'viewing', 50, 'view_count', 50],
      ['Film Scholar', 'Watch 100 movies', 'GraduationCap', 'viewing', 100, 'view_count', 100],
      ['First Review', 'Write your first review', 'MessageSquare', 'engagement', 10, 'review_count', 1],
      ['Critic', 'Write 10 reviews', 'PenTool', 'engagement', 25, 'review_count', 10],
      ['Professional Reviewer', 'Write 50 reviews', 'Award', 'engagement', 50, 'review_count', 50],
      ['Social Butterfly', 'Follow 5 users', 'Users', 'social', 15, 'following_count', 5],
      ['Popular', 'Get 10 followers', 'Star', 'social', 25, 'follower_count', 10],
      ['Influencer', 'Get 50 followers', 'TrendingUp', 'social', 75, 'follower_count', 50],
      ['List Starter', 'Add 5 movies to watchlist', 'Bookmark', 'collection', 10, 'watchlist_count', 5],
      ['Collector', 'Add 25 movies to watchlist', 'BookmarkCheck', 'collection', 25, 'watchlist_count', 25],
      ['Completionist', 'Add 100 movies to watchlist', 'Library', 'collection', 50, 'watchlist_count', 100],
      ['Genre Explorer', 'Watch movies from 5 different genres', 'Compass', 'diversity', 20, 'genre_count', 5],
      ['Genre Master', 'Watch movies from all genres', 'Trophy', 'diversity', 100, 'genre_count', 19]
    ];

    for (const [name, description, icon, category, points, requirement_type, requirement_value] of achievements) {
      await connection.execute(
        'INSERT IGNORE INTO achievements (name, description, icon, category, points, requirement_type, requirement_value) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, icon, category, points, requirement_type, requirement_value]
      );
    }

    console.log('✅ MySQL database initialized successfully');
  } finally {
    connection.release();
  }
}

// Test connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    await initializeDatabase();

    console.log('✅ MySQL database connected successfully');
    console.log(`📁 Database: ${poolConfig.database}@${poolConfig.host}:${poolConfig.port}`);
    return true;
  } catch (error) {
    console.error('❌ MySQL database connection failed:', error.message);
    return false;
  }
}

// Execute query (returns rows)
export async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

// Execute query (returns result metadata)
export async function execute(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error('Database execute error:', error.message);
    throw error;
  }
}

// Get connection from pool
export async function getConnection() {
  return pool.getConnection();
}

// Get pool instance
export function getPool() {
  return pool;
}

// Close pool
export async function closePool() {
  await pool.end();
  console.log('MySQL connection pool closed');
}

// Export for backward compatibility
export { pool };
export { pool as db };
export default pool;
