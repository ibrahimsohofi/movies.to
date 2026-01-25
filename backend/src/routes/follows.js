import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
  getFollowStats,
} from '../controllers/followsController.js';

const router = express.Router();

// Public routes
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/:id/stats', getFollowStats);

// Protected routes
router.use(authenticateToken);
router.post('/:id/follow', followUser);
router.delete('/:id/follow', unfollowUser);
router.get('/:id/is-following', isFollowing);

export default router;
