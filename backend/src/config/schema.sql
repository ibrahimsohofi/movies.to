-- Movies.to Database Schema
-- Drop database if exists and create fresh
DROP DATABASE IF EXISTS movies_to;
CREATE DATABASE movies_to CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE movies_to;

-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB;

-- Genres Table
CREATE TABLE genres (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tmdb_id INT UNIQUE,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Movies Table
CREATE TABLE movies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tmdb_id INT UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  original_title VARCHAR(255),
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
  tagline VARCHAR(500),
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
) ENGINE=InnoDB;

-- Movie_Genres Junction Table
CREATE TABLE movie_genres (
  movie_id INT,
  genre_id INT,
  PRIMARY KEY (movie_id, genre_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Watchlist Table
CREATE TABLE watchlist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_watchlist (user_id, movie_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- Reviews Table
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 10),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_movie (user_id, movie_id),
  INDEX idx_movie_id (movie_id),
  INDEX idx_rating (rating)
) ENGINE=InnoDB;

-- Comments Table
CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  parent_id INT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_movie_id (movie_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB;

-- View History Table
CREATE TABLE view_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB;

-- Insert default genres from TMDB
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
(37, 'Western', 'western');

-- Create admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@movies.to', '$2a$10$rGxJZ5xqJ5KpKqYqKqYqKeB5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5e', 'admin');
