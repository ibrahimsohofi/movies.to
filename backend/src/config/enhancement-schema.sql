-- Movies.to Enhancement Schema
-- Features: Analytics Dashboard, Social Sharing, Watch Party

-- =====================================================
-- 1. ADVANCED ANALYTICS DASHBOARD TABLES
-- =====================================================

-- User statistics cache
CREATE TABLE IF NOT EXISTS user_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
);

-- Viewing patterns (day of week, hour of day)
CREATE TABLE IF NOT EXISTS viewing_patterns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    day_of_week TINYINT,
    hour_of_day TINYINT,
    view_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_pattern (user_id, day_of_week, hour_of_day)
);

-- Genre statistics per user
CREATE TABLE IF NOT EXISTS user_genre_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    genre_id INT NOT NULL,
    movies_watched INT DEFAULT 0,
    total_runtime_minutes INT DEFAULT 0,
    avg_rating DECIMAL(3,2),
    last_watched TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_genre (user_id, genre_id)
);

-- =====================================================
-- 2. SOCIAL SHARING TABLES
-- =====================================================

-- Share tracking
CREATE TABLE IF NOT EXISTS share_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content_type ENUM('movie', 'list', 'review', 'watchlist', 'year_review', 'profile') NOT NULL,
    content_id INT NOT NULL,
    platform ENUM('twitter', 'facebook', 'instagram', 'linkedin', 'whatsapp', 'copy_link', 'native') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_content (user_id, content_type),
    INDEX idx_platform (platform),
    INDEX idx_created (created_at)
);

-- =====================================================
-- 3. WATCH PARTY TABLES
-- =====================================================

-- Watch parties
CREATE TABLE IF NOT EXISTS watch_parties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    host_user_id INT NOT NULL,
    movie_id INT NOT NULL,
    party_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255),
    status ENUM('waiting', 'active', 'paused', 'ended') DEFAULT 'waiting',
    max_participants INT DEFAULT 10,
    is_public BOOLEAN DEFAULT false,
    scheduled_time TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_party_code (party_code),
    INDEX idx_status (status),
    INDEX idx_host (host_user_id),
    INDEX idx_public_active (is_public, status)
);

-- Watch party participants
CREATE TABLE IF NOT EXISTS watch_party_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    party_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (party_id) REFERENCES watch_parties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_party_user (party_id, user_id),
    INDEX idx_party_active (party_id, is_active)
);

-- Watch party messages (chat)
CREATE TABLE IF NOT EXISTS watch_party_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    party_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('chat', 'system', 'reaction') DEFAULT 'chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (party_id) REFERENCES watch_parties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_party_time (party_id, created_at)
);

-- Watch party playback state
CREATE TABLE IF NOT EXISTS watch_party_playback_state (
    id INT PRIMARY KEY AUTO_INCREMENT,
    party_id INT NOT NULL UNIQUE,
    current_time DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_playing BOOLEAN DEFAULT false,
    updated_by INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (party_id) REFERENCES watch_parties(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_party (party_id)
);

-- =====================================================
-- SAMPLE DATA / INDEXES
-- =====================================================

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_rating ON reviews(user_id, rating);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_watched ON watchlist(user_id, watched);
CREATE INDEX IF NOT EXISTS idx_view_history_user ON view_history(user_id, viewed_at);
