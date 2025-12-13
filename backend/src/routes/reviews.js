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

// Public routes
router.get('/movie/:tmdb_id', optionalAuth, getMovieReviews);
router.get('/movie/:tmdb_id/rating', getMovieRating);

// Protected routes
router.get('/movie/:tmdb_id/user', authenticateToken, getUserReview);
router.get('/user', authenticateToken, getUserReviews);
router.post('/movie/:tmdb_id', authenticateToken, addReview);
router.put('/:reviewId', authenticateToken, updateReview);
router.delete('/:reviewId', authenticateToken, deleteReview);
router.post('/:reviewId/vote', authenticateToken, voteReview);

// Report routes
router.post('/:reviewId/report', authenticateToken, reportReview);
router.get('/reports', authenticateToken, getAllReports);
router.put('/reports/:reportId', authenticateToken, updateReportStatus);

export default router;
