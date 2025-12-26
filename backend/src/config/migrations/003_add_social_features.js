export const up = (db) => {
  // User Lists & Collections
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_public BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS list_movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      tmdb_id INTEGER NOT NULL,
      movie_data TEXT,
      position INTEGER DEFAULT 0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS list_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(list_id, user_id)
    );
  `);

  // User Following System
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(follower_id, following_id),
      CHECK (follower_id != following_id)
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_follower ON user_follows(follower_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_following ON user_follows(following_id);`);

  // Activity Feed
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL CHECK(activity_type IN ('review', 'watchlist_add', 'list_create', 'comment', 'list_like')),
      movie_id INTEGER,
      list_id INTEGER,
      review_id INTEGER,
      comment_id INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_created ON activities(user_id, created_at DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_created ON activities(created_at DESC);`);

  // Notifications System
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('comment_reply', 'new_follower', 'list_like', 'mention', 'new_review')),
      title TEXT NOT NULL,
      message TEXT,
      link TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_unread ON notifications(user_id, is_read, created_at DESC);`);

  console.log('✅ Social features migration completed');
};

export const down = (db) => {
  db.exec('DROP TABLE IF EXISTS notifications;');
  db.exec('DROP TABLE IF EXISTS activities;');
  db.exec('DROP TABLE IF EXISTS user_follows;');
  db.exec('DROP TABLE IF EXISTS list_likes;');
  db.exec('DROP TABLE IF EXISTS list_movies;');
  db.exec('DROP TABLE IF EXISTS lists;');
  console.log('✅ Social features migration rolled back');
};
