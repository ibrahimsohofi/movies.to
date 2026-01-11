import express from 'express';
import {
  getAllQuizzes,
  getQuizById,
  submitQuizScore,
  getUserQuizHistory,
  getQuizLeaderboard,
  getUserAchievements,
} from '../controllers/quizController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/quizzes', getAllQuizzes);
router.get('/quizzes/:id', getQuizById);
router.get('/leaderboard', getQuizLeaderboard);
router.get('/leaderboard/:quizId', getQuizLeaderboard);

// Protected routes (require authentication)
router.post('/quizzes/:quizId/submit', authenticateToken, submitQuizScore);
router.get('/history', authenticateToken, getUserQuizHistory);
router.get('/achievements', authenticateToken, getUserAchievements);

export default router;
