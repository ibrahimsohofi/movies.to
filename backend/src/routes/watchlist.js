import express from 'express';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist
} from '../controllers/watchlistController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:tmdb_id', removeFromWatchlist);
router.get('/check/:tmdb_id', checkWatchlist);

export default router;
