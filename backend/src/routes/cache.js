import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { getCacheStats, resetCacheStats, clearCache, clearUserCache } from '../middleware/cache.js';
import { deleteCachePattern, isRedisReady } from '../config/redis.js';

const router = express.Router();

// Get cache statistics (public)
router.get('/stats', (req, res) => {
  const stats = getCacheStats();
  res.json(stats);
});

// Reset cache statistics (admin only)
router.post('/stats/reset', authenticateToken, (req, res) => {
  // In a real app, check if user is admin
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  resetCacheStats();
  res.json({ success: true, message: 'Cache stats reset' });
});

// Clear all cache (admin only)
router.post('/clear', authenticateToken, async (req, res) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (!isRedisReady()) {
    return res.status(503).json({ error: 'Redis is not available' });
  }

  try {
    await deleteCachePattern('*');
    resetCacheStats();
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Clear specific cache pattern (admin only)
router.post('/clear/:pattern', authenticateToken, async (req, res) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { pattern } = req.params;

  try {
    await deleteCachePattern(`*${pattern}*`);
    res.json({ success: true, message: `Cache cleared for pattern: ${pattern}` });
  } catch (error) {
    console.error('Clear cache pattern error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Clear current user's cache
router.post('/clear/user', authenticateToken, async (req, res) => {
  try {
    await clearUserCache(req.user.id);
    res.json({ success: true, message: 'Your cache has been cleared' });
  } catch (error) {
    console.error('Clear user cache error:', error);
    res.status(500).json({ error: 'Failed to clear user cache' });
  }
});

export default router;
