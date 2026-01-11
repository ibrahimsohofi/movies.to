import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getPersonalizedFeed,
  getFollowingFeed,
  getTrendingFeed,
  getUserActivities,
} from '../controllers/activityController.js';

const router = express.Router();

// Protected routes
router.use(authenticateToken);
router.get('/feed', getPersonalizedFeed);
router.get('/feed/following', getFollowingFeed);
router.get('/feed/trending', getTrendingFeed);
router.get('/user/:id', getUserActivities);

export default router;
