-- AI-Powered Recommendations Engine Schema
-- Movies.to Enhancement

-- =====================================================
-- 1. USER PREFERENCES TABLE
-- Stores computed user preferences based on behavior
-- =====================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    preferred_genres JSON,
    preferred_actors JSON,
    preferred_directors JSON,
    preferred_decades JSON,
    avg_rating_given DECIMAL(3,2),
    favorite_runtime_range VARCHAR(20),
    preferred_languages JSON,
    mood_preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
);

-- =====================================================
-- 2. ML RECOMMENDATIONS TABLE
-- Stores computed ML-based recommendations
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    tmdb_id INT NOT NULL,
    score DECIMAL(5,4) NOT NULL,
    reason VARCHAR(255),
    algorithm ENUM('collaborative', 'content', 'hybrid', 'trending', 'similar_users') DEFAULT 'hybrid',
    metadata JSON,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_score (user_id, score DESC),
    INDEX idx_user_algorithm (user_id, algorithm),
    INDEX idx_expires (expires_at),
    UNIQUE KEY unique_user_movie_algo (user_id, tmdb_id, algorithm)
);

-- =====================================================
-- 3. USER INTERACTIONS TABLE
-- Tracks all user interactions for better recommendations
-- =====================================================

CREATE TABLE IF NOT EXISTS user_interactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    movie_id INT,
    tmdb_id INT,
    interaction_type ENUM('view', 'watchlist_add', 'watchlist_remove', 'rating', 'review', 'share', 'search', 'click', 'hover', 'trailer_watch', 'list_add') NOT NULL,
    interaction_value VARCHAR(255),
    session_id VARCHAR(100),
    duration_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, interaction_type),
    INDEX idx_user_movie (user_id, tmdb_id),
    INDEX idx_created (created_at),
    INDEX idx_session (session_id)
);

-- =====================================================
-- 4. SIMILAR USERS CACHE TABLE
-- Caches similar user relationships for collaborative filtering
-- =====================================================

CREATE TABLE IF NOT EXISTS similar_users_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    similar_user_id INT NOT NULL,
    similarity_score DECIMAL(5,4) NOT NULL,
    common_movies INT DEFAULT 0,
    avg_rating_diff DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (similar_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_similarity (user_id, similarity_score DESC),
    UNIQUE KEY unique_user_pair (user_id, similar_user_id)
);

-- =====================================================
-- 5. RECOMMENDATION FEEDBACK TABLE
-- Tracks user feedback on recommendations for model improvement
-- =====================================================

CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recommendation_id INT NOT NULL,
    feedback_type ENUM('like', 'dislike', 'not_interested', 'already_watched', 'clicked', 'ignored') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendation_id) REFERENCES ml_recommendations(id) ON DELETE CASCADE,
    INDEX idx_user_feedback (user_id, feedback_type)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reviews_user_rating ON reviews(user_id, rating);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_movie ON watchlist(user_id, movie_id);
CREATE INDEX IF NOT EXISTS idx_view_history_user_recent ON view_history(user_id, viewed_at DESC);
