import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function setupDatabase() {
  try {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

    // Remove existing database
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('🗑️  Removed existing database');
    }

    // Create new database
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');

    console.log('📡 Created SQLite database');

    // Create schema (SQLite version)
    const schema = `
-- Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  avatar_url TEXT,
  oauth_provider TEXT,
  oauth_id TEXT,
  email_verified INTEGER DEFAULT 0,
  email_verification_token TEXT,
  email_verification_expires DATETIME,
  password_reset_token TEXT,
  password_reset_expires DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_oauth_provider_id ON users(oauth_provider, oauth_id);
CREATE INDEX idx_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_password_reset_token ON users(password_reset_token);

-- Genres Table
CREATE TABLE genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tmdb_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Movies Table
CREATE TABLE movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tmdb_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  original_title TEXT,
  overview TEXT,
  release_date TEXT,
  runtime INTEGER,
  vote_average REAL,
  vote_count INTEGER,
  popularity REAL,
  poster_path TEXT,
  backdrop_path TEXT,
  original_language TEXT,
  status TEXT,
  tagline TEXT,
  budget INTEGER,
  revenue INTEGER,
  imdb_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tmdb_id ON movies(tmdb_id);
CREATE INDEX idx_title ON movies(title);
CREATE INDEX idx_release_date ON movies(release_date);
CREATE INDEX idx_vote_average ON movies(vote_average);
CREATE INDEX idx_popularity ON movies(popularity);

-- Movie_Genres Junction Table
CREATE TABLE movie_genres (
  movie_id INTEGER,
  genre_id INTEGER,
  PRIMARY KEY (movie_id, genre_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Watchlist Table
CREATE TABLE watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  UNIQUE(user_id, movie_id)
);

CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);

-- Reviews Table
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  review_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  UNIQUE(user_id, movie_id)
);

CREATE INDEX idx_reviews_movie_id ON reviews(movie_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Comments Table
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  parent_id INTEGER NULL,
  comment_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_movie_id ON comments(movie_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- View History Table
CREATE TABLE view_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE INDEX idx_view_history_user_id ON view_history(user_id);
CREATE INDEX idx_view_history_viewed_at ON view_history(viewed_at);
    `;

    console.log('📝 Creating database schema...');
    db.exec(schema);

    // Insert genres
    console.log('📚 Inserting genres...');
    const insertGenre = db.prepare('INSERT INTO genres (tmdb_id, name, slug) VALUES (?, ?, ?)');
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

    const insertMany = db.transaction((genres) => {
      for (const genre of genres) {
        insertGenre.run(genre);
      }
    });
    insertMany(genres);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = 'admin123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run('admin', 'admin@movies.to', passwordHash, 'admin');

    console.log('✅ Database setup completed successfully!');
    console.log('\n📊 Database: SQLite at', dbPath);
    console.log('👤 Admin user created:');
    console.log('   Username: admin');
    console.log('   Email: admin@movies.to');
    console.log('   Password: admin123');
    console.log('\n⚠️  Please change the admin password after first login!\n');

    db.close();

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

setupDatabase();
