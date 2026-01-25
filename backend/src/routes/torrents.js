import express from 'express';
import { getTorrentsByImdb } from '../controllers/torrentsController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Torrents
 *   description: Torrent information from YTS API
 */

/**
 * @swagger
 * /torrents/imdb/{imdb_id}:
 *   get:
 *     summary: Get torrent information for a movie by IMDb ID
 *     tags: [Torrents]
 *     parameters:
 *       - in: path
 *         name: imdb_id
 *         required: true
 *         schema:
 *           type: string
 *         description: IMDb movie ID (e.g., tt0137523)
 *         example: tt0137523
 *     responses:
 *       200:
 *         description: Torrent information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 torrents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       quality:
 *                         type: string
 *                         example: "1080p"
 *                       type:
 *                         type: string
 *                         example: "bluray"
 *                       size:
 *                         type: string
 *                         example: "2.1 GB"
 *                       url:
 *                         type: string
 *                         format: uri
 *       404:
 *         description: No torrents found for this movie
 */
router.get('/imdb/:imdb_id', getTorrentsByImdb);

export default router;
