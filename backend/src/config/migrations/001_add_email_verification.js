import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export const up = (db) => {
  console.log('Running migration: Add email verification and password reset fields');

  // Add new columns to users table
  db.exec(`
    ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN email_verification_token TEXT;
    ALTER TABLE users ADD COLUMN email_verification_expires DATETIME;
    ALTER TABLE users ADD COLUMN password_reset_token TEXT;
    ALTER TABLE users ADD COLUMN password_reset_expires DATETIME;
  `);

  // Create indexes for tokens
  db.exec(`
    CREATE INDEX idx_email_verification_token ON users(email_verification_token);
    CREATE INDEX idx_password_reset_token ON users(password_reset_token);
  `);

  console.log('✅ Migration completed: Email verification and password reset fields added');
};

export const down = (db) => {
  console.log('Rolling back migration: Remove email verification and password reset fields');

  // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
  db.exec(`
    CREATE TABLE users_backup AS SELECT
      id, username, email, password_hash, role, avatar_url, created_at, updated_at
    FROM users;

    DROP TABLE users;

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO users SELECT * FROM users_backup;
    DROP TABLE users_backup;

    CREATE INDEX idx_email ON users(email);
    CREATE INDEX idx_username ON users(username);
  `);

  console.log('✅ Rollback completed');
};

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../database.sqlite');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  try {
    up(db);
    db.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
