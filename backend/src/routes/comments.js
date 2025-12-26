import express from 'express';
import {
  getMovieComments,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  reportComment,
  getAllCommentReports,
  updateCommentReportStatus,
} from '../controllers/commentController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/movie/:tmdb_id', optionalAuth, getMovieComments);

// Protected routes
router.post('/movie/:tmdb_id', authenticateToken, addComment);
router.put('/:commentId', authenticateToken, updateComment);
router.delete('/:commentId', authenticateToken, deleteComment);
router.post('/:commentId/like', authenticateToken, likeComment);
router.delete('/:commentId/like', authenticateToken, unlikeComment);

// Report routes
router.post('/:commentId/report', authenticateToken, reportComment);
router.get('/reports', authenticateToken, getAllCommentReports);
router.put('/reports/:reportId', authenticateToken, updateCommentReportStatus);

export default router;
