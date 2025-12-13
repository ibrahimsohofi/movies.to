import express from 'express';
import { searchUsers, getUserByUsername } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search users (authenticated only)
router.get('/search', authenticateToken, searchUsers);

// Get user by username (public)
router.get('/:username', getUserByUsername);

export default router;
