import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import {
  getRecommendations,
  refreshRecommendations,
  getSimilarMovies,
  getAIRecommendations,
  getMoodRecommendations,
  getBecauseWatched,
  getContentBased,
  getTrending,
  getUserProfile,
  trackUserInteraction,
  getAvailableMoods,
} from '../controllers/recommendationController.js';

const router = express.Router();

// Public routes
router.get('/moods', getAvailableMoods);

// Protected routes
router.use(authenticateToken);

// Legacy recommendations
router.get('/', getRecommendations);
router.post('/refresh', refreshRecommendations);
router.get('/similar/:id', getSimilarMovies);

// AI-powered recommendations
router.get('/ai', getAIRecommendations);
router.get('/ai/mood/:mood', getMoodRecommendations);
router.get('/ai/because-watched', getBecauseWatched);
router.get('/ai/content-based', getContentBased);
router.get('/ai/trending', getTrending);

// User profile and interaction tracking
router.get('/profile', getUserProfile);
router.post('/track', trackUserInteraction);

export default router;
