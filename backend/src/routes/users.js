import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import {
  searchUsers,
  getUserByUsername,
  getProfile,
  getActivityFeed,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  uploadAvatar,
  getUserAchievements,
  trackMovieView
} from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.get('/search', searchUsers);
router.get('/:username', getUserByUsername);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/:userId/achievements', getUserAchievements);

// Optional auth routes (works with or without token)
router.post('/track-view/:tmdb_id', optionalAuth, trackMovieView);

// Protected routes
router.use(authenticateToken);

// Profile management
router.get('/me/profile', getProfile);
router.post('/me/avatar', uploadAvatar);

// Activity feed
router.get('/me/activity', getActivityFeed);

// Social features
router.post('/:userId/follow', followUser);
router.delete('/:userId/follow', unfollowUser);

// Achievements
router.get('/me/achievements', getUserAchievements);

export default router;
