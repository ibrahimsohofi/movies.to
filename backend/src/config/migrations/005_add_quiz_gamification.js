export const up = (db) => {
  console.log('Running migration: 005_add_quiz_gamification');

  // Quizzes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
      category VARCHAR(100),
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Quiz questions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      correct_answer VARCHAR(255) NOT NULL,
      wrong_answer_1 VARCHAR(255) NOT NULL,
      wrong_answer_2 VARCHAR(255) NOT NULL,
      wrong_answer_3 VARCHAR(255) NOT NULL,
      hint TEXT,
      points INTEGER DEFAULT 10,
      tmdb_movie_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );
  `);

  // User quiz scores table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_quiz_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quiz_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      time_taken INTEGER,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );
  `);

  // User achievements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_type VARCHAR(50) NOT NULL,
      achievement_name VARCHAR(255) NOT NULL,
      achievement_description TEXT,
      icon VARCHAR(50),
      points INTEGER DEFAULT 0,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, achievement_type)
    );
  `);

  // User stats table for tracking progress
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      total_reviews INTEGER DEFAULT 0,
      total_watchlist_items INTEGER DEFAULT 0,
      total_lists INTEGER DEFAULT 0,
      total_quiz_completions INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      login_streak INTEGER DEFAULT 0,
      last_login_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_user_quiz_scores_user_id ON user_quiz_scores(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_quiz_scores_quiz_id ON user_quiz_scores(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
  `);

  // Insert sample quizzes
  db.exec(`
    INSERT OR IGNORE INTO quizzes (id, title, description, difficulty, category) VALUES
    (1, 'Classic Movies Quiz', 'Test your knowledge of classic cinema', 'easy', 'general'),
    (2, 'Action Movie Trivia', 'How well do you know action movies?', 'medium', 'genre'),
    (3, 'Director Masters', 'Identify movies by their directors', 'hard', 'directors');
  `);

  // Insert sample questions for quiz 1
  db.exec(`
    INSERT OR IGNORE INTO quiz_questions (quiz_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, points) VALUES
    (1, 'What year was "The Godfather" released?', '1972', '1970', '1975', '1968', 10),
    (1, 'Who directed "Psycho"?', 'Alfred Hitchcock', 'Stanley Kubrick', 'Martin Scorsese', 'Francis Ford Coppola', 10),
    (1, 'Which movie won Best Picture in 1994?', 'Forrest Gump', 'Pulp Fiction', 'The Shawshank Redemption', 'Jurassic Park', 15),
    (1, 'Who played Rick Blaine in "Casablanca"?', 'Humphrey Bogart', 'Cary Grant', 'James Stewart', 'Clark Gable', 10),
    (1, 'What is the highest-grossing film of all time (unadjusted)?', 'Avatar', 'Avengers: Endgame', 'Titanic', 'Star Wars', 15);
  `);

  console.log('✅ Migration 005_add_quiz_gamification completed');
};

export const down = (db) => {
  console.log('Rolling back migration: 005_add_quiz_gamification');

  db.exec('DROP TABLE IF EXISTS user_stats;');
  db.exec('DROP TABLE IF EXISTS user_achievements;');
  db.exec('DROP TABLE IF EXISTS user_quiz_scores;');
  db.exec('DROP TABLE IF EXISTS quiz_questions;');
  db.exec('DROP TABLE IF EXISTS quizzes;');

  console.log('✅ Migration 005_add_quiz_gamification rolled back');
};
