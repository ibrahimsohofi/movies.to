import express from 'express';
import analyticsService from '../services/analyticsService.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/analytics/statistics:
 *   get:
 *     summary: Get user statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await analyticsService.calculateUserStatistics(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate statistics' });
  }
});

/**
 * @swagger
 * /api/analytics/year-in-review/{year}:
 *   get:
 *     summary: Get year in review
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Year in review data
 */
router.get('/year-in-review/:year', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year } = req.params;
    const review = await analyticsService.getYearInReview(userId, parseInt(year));
    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Year in review error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate year in review' });
  }
});

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get monthly viewing trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Monthly trends data
 */
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 12 } = req.query;
    const trends = await analyticsService.getMonthlyTrends(userId, parseInt(months));
    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to get trends' });
  }
});

/**
 * @swagger
 * /api/analytics/genres:
 *   get:
 *     summary: Get genre statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Genre statistics
 */
router.get('/genres', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const genreStats = await analyticsService.getGenreStats(userId);
    res.json({ success: true, data: genreStats });
  } catch (error) {
    console.error('Genre stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get genre statistics' });
  }
});

/**
 * @swagger
 * /api/analytics/comparison:
 *   get:
 *     summary: Get comparison with other users
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User comparison data
 */
router.get('/comparison', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const comparison = await analyticsService.getUserComparison(userId);
    res.json({ success: true, data: comparison });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ success: false, message: 'Failed to get comparison' });
  }
});

/**
 * @swagger
 * /api/analytics/track-view:
 *   post:
 *     summary: Track viewing pattern
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Viewing tracked
 */
router.post('/track-view', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await analyticsService.trackViewingPattern(userId);
    res.json({ success: true, message: 'Viewing tracked' });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ success: false, message: 'Failed to track viewing' });
  }
});

export default router;
