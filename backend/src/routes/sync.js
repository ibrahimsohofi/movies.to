import express from 'express';
import { syncMovieByTmdbId } from '../controllers/syncController.js';

const router = express.Router();

router.get('/movie/:tmdb_id', syncMovieByTmdbId);

export default router;
