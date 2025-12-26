import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getRecommendations,
  refreshRecommendations,
  getSimilarMovies,
} from '../controllers/recommendationController.js';

const router = express.Router();

// Protected routes
router.use(authenticateToken);
router.get('/', getRecommendations);
router.post('/refresh', refreshRecommendations);
router.get('/similar/:id', getSimilarMovies);

export default router;
