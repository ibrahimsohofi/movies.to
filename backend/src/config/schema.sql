-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  avatar_url TEXT,
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires DATETIME,
  password_reset_token VARCHAR(255),
  password_reset_expires DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_oauth_provider_id (oauth_provider, oauth_id),
  INDEX idx_email_verification_token (email_verification_token),
  INDEX idx_password_reset_token (password_reset_token)
);

-- Genres Table
CREATE TABLE IF NOT EXISTS genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tmdb_id INT UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies Table
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
  INDEX idx_title (title),
  INDEX idx_release_date (release_date),
  INDEX idx_vote_average (vote_average),
  INDEX idx_popularity (popularity)
);

-- Movie_Genres Junction Table
CREATE TABLE IF NOT EXISTS movie_genres (
  movie_id INT,
  genre_id INT,
  PRIMARY KEY (movie_id, genre_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Watchlist Table
CREATE TABLE IF NOT EXISTS watchlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_watchlist (user_id, movie_id),
  INDEX idx_watchlist_user_id (user_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 10),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (user_id, movie_id),
  INDEX idx_reviews_movie_id (movie_id),
  INDEX idx_reviews_rating (rating)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  parent_id INT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_comments_movie_id (movie_id),
  INDEX idx_comments_user_id (user_id),
  INDEX idx_comments_parent_id (parent_id)
);

-- View History Table
CREATE TABLE IF NOT EXISTS view_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  INDEX idx_view_history_user_id (user_id),
  INDEX idx_view_history_viewed_at (viewed_at)
);

-- Torrents Cache Table
CREATE TABLE IF NOT EXISTS torrents_cache (
  imdb_id VARCHAR(20) PRIMARY KEY,
  data_json JSON NOT NULL,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_torrents_cached_at (cached_at)
);

-- User Follows Table (for social features)
CREATE TABLE IF NOT EXISTS user_follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, following_id)
);

-- Lists Table
CREATE TABLE IF NOT EXISTS lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- List Items Table
CREATE TABLE IF NOT EXISTS list_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  list_id INT NOT NULL,
  movie_id INT NOT NULL,
  position INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_list_item (list_id, movie_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Feed Table
CREATE TABLE IF NOT EXISTS activity_feed (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  reference_id INT,
  reference_type VARCHAR(50),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recommendations Cache Table
CREATE TABLE IF NOT EXISTS recommendations_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_recommendation (user_id, movie_id)
);

-- Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50) DEFAULT 'medium',
  category VARCHAR(50) DEFAULT 'general',
  created_by INT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  image_url VARCHAR(500),
  points INT DEFAULT 10,
  type VARCHAR(50) DEFAULT 'multiple_choice',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Quiz Answers Table
CREATE TABLE IF NOT EXISTS quiz_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  answer_text VARCHAR(500) NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);

-- Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score INT DEFAULT 0,
  max_possible_score INT DEFAULT 0,
  completion_time INT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Achievements Table
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
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  progress INT DEFAULT 0,
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_achievement (user_id, achievement_id)
);

-- Subscriptions Table for premium tiers
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  plan_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_start DATETIME,
  current_period_end DATETIME,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default genres if none exist
INSERT INTO genres (tmdb_id, name, slug) VALUES
(28, 'Action', 'action'),
(12, 'Adventure', 'adventure'),
(16, 'Animation', 'animation'),
(35, 'Comedy', 'comedy'),
(80, 'Crime', 'crime'),
(99, 'Documentary', 'documentary'),
(18, 'Drama', 'drama'),
(10751, 'Family', 'family'),
(14, 'Fantasy', 'fantasy'),
(36, 'History', 'history'),
(27, 'Horror', 'horror'),
(10402, 'Music', 'music'),
(9648, 'Mystery', 'mystery'),
(10749, 'Romance', 'romance'),
(878, 'Science Fiction', 'science-fiction'),
(10770, 'TV Movie', 'tv-movie'),
(53, 'Thriller', 'thriller'),
(10752, 'War', 'war'),
(37, 'Western', 'western')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert default achievements if none exist
INSERT INTO achievements (name, description, icon, category, points, requirement_type, requirement_value) VALUES
('First Steps', 'Watch your first movie', 'Play', 'viewing', 10, 'view_count', 1),
('Movie Buff', 'Watch 10 movies', 'Film', 'viewing', 25, 'view_count', 10),
('Cinema Addict', 'Watch 50 movies', 'Clapperboard', 'viewing', 50, 'view_count', 50),
('Film Scholar', 'Watch 100 movies', 'GraduationCap', 'viewing', 100, 'view_count', 100),
('First Review', 'Write your first review', 'MessageSquare', 'engagement', 10, 'review_count', 1),
('Critic', 'Write 10 reviews', 'PenTool', 'engagement', 25, 'review_count', 10),
('Professional Reviewer', 'Write 50 reviews', 'Award', 'engagement', 50, 'review_count', 50),
('Social Butterfly', 'Follow 5 users', 'Users', 'social', 15, 'following_count', 5),
('Popular', 'Get 10 followers', 'Star', 'social', 25, 'follower_count', 10),
('Influencer', 'Get 50 followers', 'TrendingUp', 'social', 75, 'follower_count', 50),
('List Starter', 'Add 5 movies to watchlist', 'Bookmark', 'collection', 10, 'watchlist_count', 5),
('Collector', 'Add 25 movies to watchlist', 'BookmarkCheck', 'collection', 25, 'watchlist_count', 25),
('Completionist', 'Add 100 movies to watchlist', 'Library', 'collection', 50, 'watchlist_count', 100),
('Genre Explorer', 'Watch movies from 5 different genres', 'Compass', 'diversity', 20, 'genre_count', 5),
('Genre Master', 'Watch movies from all genres', 'Trophy', 'diversity', 100, 'genre_count', 19)
ON DUPLICATE KEY UPDATE description=VALUES(description);
