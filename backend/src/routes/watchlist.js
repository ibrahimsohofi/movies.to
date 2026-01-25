import express from 'express';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist
} from '../controllers/watchlistController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Watchlist
 *   description: User watchlist management
 */

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /watchlist:
 *   get:
 *     summary: Get user's watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Watchlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 watchlist:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WatchlistItem'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', getWatchlist);
/**
 * @swagger
 * /watchlist:
 *   post:
 *     summary: Add a movie to watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tmdb_id
 *             properties:
 *               tmdb_id:
 *                 type: integer
 *                 example: 550
 *                 description: TMDB movie ID
 *               movie_data:
 *                 type: object
 *                 description: Optional movie metadata to cache
 *     responses:
 *       201:
 *         description: Movie added to watchlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Movie added to watchlist
 *       400:
 *         description: Movie already in watchlist
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', addToWatchlist);
/**
 * @swagger
 * /watchlist/{tmdb_id}:
 *   delete:
 *     summary: Remove a movie from watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tmdb_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB movie ID
 *         example: 550
 *     responses:
 *       200:
 *         description: Movie removed from watchlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Movie removed from watchlist
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:tmdb_id', removeFromWatchlist);
/**
 * @swagger
 * /watchlist/check/{tmdb_id}:
 *   get:
 *     summary: Check if a movie is in watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tmdb_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB movie ID
 *         example: 550
 *     responses:
 *       200:
 *         description: Check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 inWatchlist:
 *                   type: boolean
 *                   example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/check/:tmdb_id', checkWatchlist);

export default router;
