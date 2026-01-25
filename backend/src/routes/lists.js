import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createList,
  getUserLists,
  getPublicLists,
  getListDetails,
  updateList,
  deleteList,
  addMovieToList,
  removeMovieFromList,
  likeList,
  unlikeList,
} from '../controllers/listsController.js';

const router = express.Router();

// Public routes
router.get('/public', getPublicLists);
router.get('/:id', getListDetails);

// Protected routes
router.use(authenticateToken);
router.post('/', createList);
router.get('/', getUserLists);
router.put('/:id', updateList);
router.delete('/:id', deleteList);
router.post('/:id/movies', addMovieToList);
router.delete('/:id/movies/:movieId', removeMovieFromList);
router.post('/:id/like', likeList);
router.delete('/:id/like', unlikeList);

export default router;
