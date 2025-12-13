import express from 'express';
import { getTorrentsByImdb } from '../controllers/torrentsController.js';

// ... existing code ... <no existing code in this new file>

const router = express.Router();

router.get('/imdb/:imdb_id', getTorrentsByImdb);

export default router;
