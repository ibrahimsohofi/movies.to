import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import {
  getCollaborators,
  inviteCollaborator,
  acceptInvite,
  removeCollaborator,
  updateCollaboratorRole,
  getListActivity,
  addListComment,
  getListComments,
  getCollaboratingLists,
} from '../controllers/collaborativeListsController.js';

const router = express.Router();

// Get lists user is collaborating on
router.get('/collaborating', authenticateToken, getCollaboratingLists);

// Accept invite by token
router.post('/invite/:token/accept', authenticateToken, acceptInvite);

// List-specific collaboration routes
router.get('/:id/collaborators', optionalAuth, getCollaborators);
router.post('/:id/collaborators', authenticateToken, inviteCollaborator);
router.delete('/:id/collaborators/:collaboratorId', authenticateToken, removeCollaborator);
router.put('/:id/collaborators/:collaboratorId/role', authenticateToken, updateCollaboratorRole);

// Activity log
router.get('/:id/activity', optionalAuth, getListActivity);

// Comments
router.get('/:id/comments', optionalAuth, getListComments);
router.post('/:id/comments', authenticateToken, addListComment);

export default router;
