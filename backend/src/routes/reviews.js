import express from 'express';
import {
  getMovieReviews,
  addReview,
  deleteReview,
  getUserReview,
  getMovieRating,
  updateReview,
  getUserReviews,
  voteReview,
  reportReview,
  getAllReports,
  updateReportStatus,
} from '../controllers/reviewController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Movie reviews and ratings management
 */

/**
 * @swagger
 * /reviews/movie/{tmdb_id}:
 *   get:
 *     summary: Get all reviews for a movie
 *     tags: [Reviews]
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
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 */
// Public routes
router.get('/movie/:tmdb_id', optionalAuth, getMovieReviews);
router.get('/movie/:tmdb_id/rating', getMovieRating);

// Protected routes
router.get('/movie/:tmdb_id/user', authenticateToken, getUserReview);
router.get('/user', authenticateToken, getUserReviews);
/**
 * @swagger
 * /reviews/movie/{tmdb_id}:
 *   post:
 *     summary: Add a review for a movie
 *     tags: [Reviews]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 8
 *               review_text:
 *                 type: string
 *                 example: "Great movie! Highly recommended."
 *     responses:
 *       201:
 *         description: Review added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Review already exists or validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/movie/:tmdb_id', authenticateToken, addReview);
router.put('/:reviewId', authenticateToken, updateReview);
router.delete('/:reviewId', authenticateToken, deleteReview);
router.post('/:reviewId/vote', authenticateToken, voteReview);

// Report routes
router.post('/:reviewId/report', authenticateToken, reportReview);
router.get('/reports', authenticateToken, getAllReports);
router.put('/reports/:reportId', authenticateToken, updateReportStatus);

export default router;
