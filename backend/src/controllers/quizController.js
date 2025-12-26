import { db } from '../config/database.js';

// Get all active quizzes
export const getAllQuizzes = (req, res) => {
  try {
    const quizzes = db
      .prepare(
        `
        SELECT
          q.*,
          COUNT(qq.id) as question_count,
          (
            SELECT COUNT(*)
            FROM user_quiz_scores uqs
            WHERE uqs.quiz_id = q.id
          ) as total_attempts
        FROM quizzes q
        LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
        WHERE q.is_active = 1
        GROUP BY q.id
        ORDER BY q.created_at DESC
      `
      )
      .all();

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes',
      error: error.message,
    });
  }
};

// Get quiz by ID with questions
export const getQuizById = (req, res) => {
  try {
    const { id } = req.params;

    const quiz = db
      .prepare('SELECT * FROM quizzes WHERE id = ? AND is_active = 1')
      .get(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    const questions = db
      .prepare(
        `
        SELECT
          id,
          question,
          correct_answer,
          wrong_answer_1,
          wrong_answer_2,
          wrong_answer_3,
          hint,
          points,
          tmdb_movie_id
        FROM quiz_questions
        WHERE quiz_id = ?
        ORDER BY RANDOM()
      `
      )
      .all(id);

    // Randomize answer order for each question
    const questionsWithShuffledAnswers = questions.map((q) => {
      const answers = [
        { text: q.correct_answer, isCorrect: true },
        { text: q.wrong_answer_1, isCorrect: false },
        { text: q.wrong_answer_2, isCorrect: false },
        { text: q.wrong_answer_3, isCorrect: false },
      ];

      // Fisher-Yates shuffle
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }

      return {
        id: q.id,
        question: q.question,
        answers: answers.map((a) => a.text),
        correctAnswer: q.correct_answer,
        hint: q.hint,
        points: q.points,
        tmdbMovieId: q.tmdb_movie_id,
      };
    });

    res.json({
      success: true,
      data: {
        ...quiz,
        questions: questionsWithShuffledAnswers,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
      error: error.message,
    });
  }
};

// Submit quiz score
export const submitQuizScore = (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeTaken } = req.body;
    const userId = req.user.id;

    // Get quiz questions
    const questions = db
      .prepare('SELECT id, correct_answer, points FROM quiz_questions WHERE quiz_id = ?')
      .all(quizId);

    if (!questions.length) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Calculate score
    let totalScore = 0;
    let correctAnswers = 0;

    questions.forEach((question) => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correct_answer) {
        totalScore += question.points;
        correctAnswers++;
      }
    });

    // Save score
    const stmt = db.prepare(
      `INSERT INTO user_quiz_scores
       (user_id, quiz_id, score, total_questions, time_taken)
       VALUES (?, ?, ?, ?, ?)`
    );

    const result = stmt.run(userId, quizId, totalScore, questions.length, timeTaken);

    // Update user stats
    updateUserStats(userId, 'quiz_completion', totalScore);

    // Check for achievements
    checkQuizAchievements(userId, totalScore, questions.length, correctAnswers);

    res.json({
      success: true,
      data: {
        scoreId: result.lastInsertRowid,
        score: totalScore,
        correctAnswers,
        totalQuestions: questions.length,
        percentage: Math.round((correctAnswers / questions.length) * 100),
      },
    });
  } catch (error) {
    console.error('Error submitting quiz score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz score',
      error: error.message,
    });
  }
};

// Get user quiz history
export const getUserQuizHistory = (req, res) => {
  try {
    const userId = req.user.id;

    const history = db
      .prepare(
        `
        SELECT
          uqs.*,
          q.title as quiz_title,
          q.difficulty,
          q.category
        FROM user_quiz_scores uqs
        JOIN quizzes q ON uqs.quiz_id = q.id
        WHERE uqs.user_id = ?
        ORDER BY uqs.completed_at DESC
        LIMIT 50
      `
      )
      .all(userId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz history',
      error: error.message,
    });
  }
};

// Get leaderboard
export const getQuizLeaderboard = (req, res) => {
  try {
    const { quizId } = req.params;
    const limit = req.query.limit || 10;

    let query;
    if (quizId) {
      query = db.prepare(
        `
        SELECT
          u.id,
          u.username,
          u.avatar,
          MAX(uqs.score) as best_score,
          MIN(uqs.time_taken) as best_time,
          COUNT(uqs.id) as attempts
        FROM user_quiz_scores uqs
        JOIN users u ON uqs.user_id = u.id
        WHERE uqs.quiz_id = ?
        GROUP BY u.id
        ORDER BY best_score DESC, best_time ASC
        LIMIT ?
      `
      );
      var leaderboard = query.all(quizId, limit);
    } else {
      query = db.prepare(
        `
        SELECT
          u.id,
          u.username,
          u.avatar,
          SUM(uqs.score) as total_score,
          COUNT(DISTINCT uqs.quiz_id) as quizzes_completed
        FROM user_quiz_scores uqs
        JOIN users u ON uqs.user_id = u.id
        GROUP BY u.id
        ORDER BY total_score DESC
        LIMIT ?
      `
      );
      var leaderboard = query.all(limit);
    }

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message,
    });
  }
};

// Get user achievements
export const getUserAchievements = (req, res) => {
  try {
    const userId = req.user.id;

    const achievements = db
      .prepare(
        `
        SELECT * FROM user_achievements
        WHERE user_id = ?
        ORDER BY earned_at DESC
      `
      )
      .all(userId);

    const stats = db
      .prepare('SELECT * FROM user_stats WHERE user_id = ?')
      .get(userId);

    res.json({
      success: true,
      data: {
        achievements,
        stats: stats || {},
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements',
      error: error.message,
    });
  }
};

// Helper function to update user stats
function updateUserStats(userId, action, points = 0) {
  try {
    // Get or create user stats
    let stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);

    if (!stats) {
      db.prepare(
        'INSERT INTO user_stats (user_id, total_points) VALUES (?, 0)'
      ).run(userId);
      stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
    }

    // Update stats based on action
    const updates = {
      total_points: stats.total_points + points,
    };

    if (action === 'quiz_completion') {
      updates.total_quiz_completions = (stats.total_quiz_completions || 0) + 1;
    }

    const updateQuery = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');

    db.prepare(
      `UPDATE user_stats SET ${updateQuery}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
    ).run(...Object.values(updates), userId);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// Helper function to check and award achievements
function checkQuizAchievements(userId, score, totalQuestions, correctAnswers) {
  try {
    const achievements = [];

    // First Quiz
    const quizCount = db
      .prepare('SELECT COUNT(*) as count FROM user_quiz_scores WHERE user_id = ?')
      .get(userId).count;

    if (quizCount === 1) {
      achievements.push({
        type: 'first_quiz',
        name: 'Quiz Novice',
        description: 'Complete your first quiz',
        icon: '🎯',
        points: 10,
      });
    }

    // Perfect Score
    if (correctAnswers === totalQuestions) {
      achievements.push({
        type: 'perfect_score',
        name: 'Perfect Score',
        description: 'Get 100% on a quiz',
        icon: '💯',
        points: 50,
      });
    }

    // Quiz Master (10 quizzes)
    if (quizCount === 10) {
      achievements.push({
        type: 'quiz_master',
        name: 'Quiz Master',
        description: 'Complete 10 quizzes',
        icon: '🎓',
        points: 100,
      });
    }

    // Award achievements
    achievements.forEach((achievement) => {
      try {
        db.prepare(
          `INSERT OR IGNORE INTO user_achievements
           (user_id, achievement_type, achievement_name, achievement_description, icon, points)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          userId,
          achievement.type,
          achievement.name,
          achievement.description,
          achievement.icon,
          achievement.points
        );

        // Update total points
        db.prepare(
          'UPDATE user_stats SET total_points = total_points + ? WHERE user_id = ?'
        ).run(achievement.points, userId);
      } catch (err) {
        // Achievement already exists, skip
      }
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}
