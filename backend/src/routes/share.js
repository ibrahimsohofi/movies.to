import express from 'express';
import shareService from '../services/shareService.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/share/track:
 *   post:
 *     summary: Track a share event
 *     tags: [Share]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentType:
 *                 type: string
 *               contentId:
 *                 type: integer
 *               platform:
 *                 type: string
 *     responses:
 *       200:
 *         description: Share tracked successfully
 */
router.post('/track', optionalAuth, async (req, res) => {
  try {
    const { contentType, contentId, platform } = req.body;
    const userId = req.user?.id || null;

    if (!contentType || !contentId || !platform) {
      return res.status(400).json({
        success: false,
        message: 'contentType, contentId, and platform are required'
      });
    }

    await shareService.trackShare(userId, contentType, contentId, platform);

    res.json({ success: true, message: 'Share tracked' });
  } catch (error) {
    console.error('Track share error:', error);
    res.status(500).json({ success: false, message: 'Failed to track share' });
  }
});

/**
 * @swagger
 * /api/share/generate-link:
 *   post:
 *     summary: Generate a shareable link with metadata
 *     tags: [Share]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentType:
 *                 type: string
 *               contentId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Link and metadata generated
 */
router.post('/generate-link', async (req, res) => {
  try {
    const { contentType, contentId } = req.body;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentType and contentId are required'
      });
    }

    const link = shareService.generateShareableLink(contentType, contentId);
    const metadata = await shareService.getShareMetadata(contentType, contentId);

    res.json({
      success: true,
      data: { link, metadata }
    });
  } catch (error) {
    console.error('Generate link error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate link' });
  }
});

/**
 * @swagger
 * /api/share/metadata/{contentType}/{contentId}:
 *   get:
 *     summary: Get share metadata for Open Graph tags
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Metadata for sharing
 */
router.get('/metadata/:contentType/:contentId', async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const metadata = await shareService.getShareMetadata(contentType, contentId);

    res.json({ success: true, data: metadata });
  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({ success: false, message: 'Failed to get metadata' });
  }
});

/**
 * @swagger
 * /api/share/stats:
 *   get:
 *     summary: Get user's share statistics
 *     tags: [Share]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Share statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await shareService.getUserShareStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Share stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get share stats' });
  }
});

/**
 * @swagger
 * /api/share/popular/{contentType}:
 *   get:
 *     summary: Get popular shared content
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Popular shared content
 */
router.get('/popular/:contentType', async (req, res) => {
  try {
    const { contentType } = req.params;
    const { limit = 10 } = req.query;
    const popular = await shareService.getPopularSharedContent(contentType, parseInt(limit));
    res.json({ success: true, data: popular });
  } catch (error) {
    console.error('Popular content error:', error);
    res.status(500).json({ success: false, message: 'Failed to get popular content' });
  }
});

/**
 * @swagger
 * /api/share/text:
 *   post:
 *     summary: Generate share text for a platform
 *     tags: [Share]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentType:
 *                 type: string
 *               contentId:
 *                 type: integer
 *               platform:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated share text
 */
router.post('/text', async (req, res) => {
  try {
    const { contentType, contentId, platform } = req.body;

    const metadata = await shareService.getShareMetadata(contentType, contentId);
    const text = shareService.generateShareText(contentType, metadata, platform);
    const link = shareService.generateShareableLink(contentType, contentId);

    res.json({
      success: true,
      data: { text, link, metadata }
    });
  } catch (error) {
    console.error('Generate text error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate share text' });
  }
});

export default router;
