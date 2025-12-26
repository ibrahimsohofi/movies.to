/**
 * Migration: Add Premium Tier & Subscription Features
 * Phase 6.1 - Monetization
 */

export async function up(db) {
  console.log('Running migration: 006_add_premium_tier');

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

  // Create index for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user
    ON subscriptions(user_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status
    ON subscriptions(status, expires_at)
  `);

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

  // Add premium-related fields to users table if not exists
  db.exec(`
    ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0
  `).catch(() => {
    console.log('Column is_premium already exists');
  });

  db.exec(`
    ALTER TABLE users ADD COLUMN premium_since DATETIME
  `).catch(() => {
    console.log('Column premium_since already exists');
  });

  console.log('Migration 006_add_premium_tier completed');
}

export async function down(db) {
  console.log('Rolling back migration: 006_add_premium_tier');

  db.exec('DROP TABLE IF EXISTS subscriptions');
  db.exec('DROP TABLE IF EXISTS feature_usage');

  console.log('Migration 006_add_premium_tier rolled back');
}
