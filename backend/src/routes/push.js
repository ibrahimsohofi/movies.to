import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  updatePreferences,
  getPreferences,
  testPush,
} from '../controllers/pushController.js';

const router = express.Router();

// Public route to get VAPID key
router.get('/vapid-public-key', getVapidPublicKey);

// Protected routes
router.post('/subscribe', authenticateToken, subscribe);
router.post('/unsubscribe', authenticateToken, unsubscribe);
router.put('/preferences', authenticateToken, updatePreferences);
router.get('/preferences', authenticateToken, getPreferences);
router.post('/test', authenticateToken, testPush);

export default router;
