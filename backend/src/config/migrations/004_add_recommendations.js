export const up = (db) => {
  // User Preferences
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      genre_id INTEGER,
      actor_id INTEGER,
      director_id INTEGER,
      preference_score REAL DEFAULT 1.0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_pref ON user_preferences(user_id);`);

  // Recommendations Cache
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      score REAL NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_score ON recommendations_cache(user_id, score DESC);`);

  console.log('✅ Recommendations migration completed');
};

export const down = (db) => {
  db.exec('DROP TABLE IF EXISTS recommendations_cache;');
  db.exec('DROP TABLE IF EXISTS user_preferences;');
  console.log('✅ Recommendations migration rolled back');
};
