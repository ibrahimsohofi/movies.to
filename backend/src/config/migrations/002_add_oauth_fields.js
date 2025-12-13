import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export const up = (db) => {
  console.log('Running migration: Add OAuth fields');

  // Add OAuth columns to users table
  db.exec(`
    ALTER TABLE users ADD COLUMN oauth_provider TEXT;
    ALTER TABLE users ADD COLUMN oauth_id TEXT;
  `);

  // Create index for OAuth lookups
  db.exec(`
    CREATE INDEX idx_oauth_provider_id ON users(oauth_provider, oauth_id);
  `);

  // Make password_hash optional for OAuth users
  // Note: SQLite doesn't support modifying columns, so we use a trigger instead
  // Or we can handle this in application logic

  console.log('✅ Migration completed: OAuth fields added');
};

export const down = (db) => {
  console.log('Rolling back migration: Remove OAuth fields');

  // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
  db.exec(`
    CREATE TABLE users_temp AS SELECT
      id, username, email, password_hash, role, avatar_url,
      email_verified, email_verification_token, email_verification_expires,
      password_reset_token, password_reset_expires,
      created_at, updated_at
    FROM users;

    DROP TABLE users;

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      avatar_url TEXT,
      email_verified INTEGER DEFAULT 0,
      email_verification_token TEXT,
      email_verification_expires DATETIME,
      password_reset_token TEXT,
      password_reset_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO users SELECT * FROM users_temp;
    DROP TABLE users_temp;

    CREATE INDEX idx_email ON users(email);
    CREATE INDEX idx_username ON users(username);
    CREATE INDEX idx_email_verification_token ON users(email_verification_token);
    CREATE INDEX idx_password_reset_token ON users(password_reset_token);
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
