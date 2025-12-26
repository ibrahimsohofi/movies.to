import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('Adding premium tier tables...');

  // Create subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan TEXT CHECK(plan IN ('free', 'premium')) DEFAULT 'free',
      status TEXT CHECK(status IN ('active', 'cancelled', 'expired', 'trial')) DEFAULT 'active',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      trial_ends_at DATETIME,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Subscriptions table created');

  // Create feature usage tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feature_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      feature_type TEXT NOT NULL,
      usage_count INTEGER DEFAULT 0,
      last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Feature usage table created');

  // Add is_premium column to users table if it doesn't exist
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0`);
    console.log('✅ Added is_premium column to users table');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('ℹ️  is_premium column already exists');
    } else {
      throw e;
    }
  }

  // Add premium_since column to users table if it doesn't exist
  try {
    db.exec(`ALTER TABLE users ADD COLUMN premium_since DATETIME`);
    console.log('✅ Added premium_since column to users table');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('ℹ️  premium_since column already exists');
    } else {
      throw e;
    }
  }

  console.log('\n✅ All premium tier tables created successfully!');
} catch (error) {
  console.error('❌ Error adding premium tables:', error.message);
  process.exit(1);
} finally {
  db.close();
}
