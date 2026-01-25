-- =====================================================
-- AI-Powered Recommendations & Feature Enhancement Schema
-- =====================================================

-- User Preferences for AI Recommendations
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  preferred_genres JSON,
  preferred_languages JSON,
  preferred_decades JSON,
  mood_preferences JSON,
  content_filters JSON,
  recommendation_frequency VARCHAR(50) DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Interactions for ML Training
CREATE TABLE IF NOT EXISTS user_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  interaction_type ENUM('view', 'click', 'watch', 'rating', 'add_watchlist', 'remove_watchlist', 'share', 'trailer_view') NOT NULL,
  interaction_value DECIMAL(5,2),
  session_id VARCHAR(255),
  duration_seconds INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_interactions_user (user_id),
  INDEX idx_user_interactions_movie (movie_id),
  INDEX idx_user_interactions_type (interaction_type),
  INDEX idx_user_interactions_created (created_at)
);

-- ML Recommendations Cache with Explanations
CREATE TABLE IF NOT EXISTS ml_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  algorithm_type ENUM('collaborative', 'content_based', 'hybrid', 'trending', 'mood', 'because_watched') NOT NULL,
  score DECIMAL(5,4) NOT NULL,
  explanation TEXT,
  source_movie_id INT,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ml_rec_user (user_id),
  INDEX idx_ml_rec_algorithm (algorithm_type),
  INDEX idx_ml_rec_score (score DESC),
  UNIQUE KEY unique_ml_rec (user_id, movie_id, algorithm_type)
);

-- Movie Embeddings for Content-Based Filtering
CREATE TABLE IF NOT EXISTS movie_embeddings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tmdb_id INT NOT NULL UNIQUE,
  embedding_vector JSON NOT NULL,
  genre_vector JSON,
  keyword_vector JSON,
  cast_vector JSON,
  director_hash VARCHAR(255),
  content_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_movie_embed_tmdb (tmdb_id)
);

-- =====================================================
-- Push Notification Support
-- =====================================================

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent VARCHAR(500),
  device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_push_sub_user (user_id),
  INDEX idx_push_sub_active (is_active)
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  new_releases BOOLEAN DEFAULT TRUE,
  recommendations BOOLEAN DEFAULT TRUE,
  social_updates BOOLEAN DEFAULT TRUE,
  watchlist_reminders BOOLEAN DEFAULT TRUE,
  list_updates BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notification Queue
CREATE TABLE IF NOT EXISTS notification_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSON,
  icon_url VARCHAR(500),
  action_url VARCHAR(500),
  priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
  status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_queue_user (user_id),
  INDEX idx_notif_queue_status (status),
  INDEX idx_notif_queue_scheduled (scheduled_for)
);

-- =====================================================
-- Collaborative Movie Lists
-- =====================================================

-- List Collaborators
CREATE TABLE IF NOT EXISTS list_collaborators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  list_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('viewer', 'editor', 'admin') DEFAULT 'editor',
  invited_by INT,
  invite_status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
  invite_token VARCHAR(255),
  can_add_movies BOOLEAN DEFAULT TRUE,
  can_remove_movies BOOLEAN DEFAULT TRUE,
  can_reorder BOOLEAN DEFAULT TRUE,
  can_invite BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_list_collaborator (list_id, user_id),
  INDEX idx_collab_list (list_id),
  INDEX idx_collab_user (user_id),
  INDEX idx_collab_token (invite_token)
);

-- List Activity Log
CREATE TABLE IF NOT EXISTS list_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  list_id INT NOT NULL,
  user_id INT NOT NULL,
  action_type ENUM('add_movie', 'remove_movie', 'reorder', 'update_notes', 'invite_user', 'remove_user', 'update_settings', 'comment') NOT NULL,
  movie_id INT,
  target_user_id INT,
  old_value JSON,
  new_value JSON,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_list_activity_list (list_id),
  INDEX idx_list_activity_created (created_at DESC)
);

-- List Comments/Discussions
CREATE TABLE IF NOT EXISTS list_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  list_id INT NOT NULL,
  user_id INT NOT NULL,
  movie_id INT,
  parent_id INT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES list_comments(id) ON DELETE CASCADE,
  INDEX idx_list_comments_list (list_id)
);

-- Real-time Presence for Lists
CREATE TABLE IF NOT EXISTS list_presence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  list_id INT NOT NULL,
  user_id INT NOT NULL,
  cursor_position INT,
  last_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_list_presence (list_id, user_id)
);

-- =====================================================
-- Add collaborative fields to existing lists table
-- =====================================================

ALTER TABLE lists
ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS share_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Create additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reviews_user_rating ON reviews(user_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_created ON watchlist(user_id, created_at DESC);
