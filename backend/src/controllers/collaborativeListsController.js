import { db } from '../config/database.js';
import { createNotification } from './notificationController.js';
import { emitToRoom } from '../config/socket.js';
import crypto from 'crypto';

// Generate invite token
function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Check if user has permission on list
function checkListPermission(listId, userId, requiredRole = 'viewer') {
  const roleHierarchy = { viewer: 0, editor: 1, admin: 2, owner: 3 };

  // Check if owner
  const list = db.prepare('SELECT user_id FROM lists WHERE id = ?').get(listId);
  if (list && list.user_id === userId) {
    return { hasPermission: true, role: 'owner', isOwner: true };
  }

  // Check collaborator role
  const collaborator = db.prepare(`
    SELECT role FROM list_collaborators
    WHERE list_id = ? AND user_id = ? AND accepted_at IS NOT NULL
  `).get(listId, userId);

  if (!collaborator) {
    return { hasPermission: false, role: null, isOwner: false };
  }

  const hasPermission = roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole];
  return { hasPermission, role: collaborator.role, isOwner: false };
}

// Log list activity
function logActivity(listId, userId, actionType, metadata = {}) {
  try {
    db.prepare(`
      INSERT INTO list_activity_log (list_id, user_id, action_type, target_movie_id, target_user_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      listId,
      userId,
      actionType,
      metadata.movieId || null,
      metadata.targetUserId || null,
      JSON.stringify(metadata)
    );
  } catch (error) {
    console.error('Log activity error:', error);
  }
}

// Get list collaborators
export const getCollaborators = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if user has access
    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(id);
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    if (!list.is_public && list.user_id !== userId) {
      const { hasPermission } = checkListPermission(id, userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const collaborators = db.prepare(`
      SELECT lc.*, u.username, u.avatar_url
      FROM list_collaborators lc
      INNER JOIN users u ON lc.user_id = u.id
      WHERE lc.list_id = ?
      ORDER BY lc.created_at ASC
    `).all(id);

    // Get owner info
    const owner = db.prepare('SELECT id, username, avatar_url FROM users WHERE id = ?').get(list.user_id);

    res.json({
      owner,
      collaborators: collaborators.map(c => ({
        ...c,
        isPending: !c.accepted_at
      }))
    });
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ error: 'Failed to get collaborators' });
  }
};

// Invite collaborator
export const inviteCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, role = 'editor' } = req.body;
    const userId = req.user.id;

    // Check if user is owner or admin
    const { hasPermission, isOwner } = checkListPermission(id, userId, 'admin');
    if (!hasPermission && !isOwner) {
      return res.status(403).json({ error: 'Only owners and admins can invite collaborators' });
    }

    // Find user by email or username
    let invitee;
    if (email) {
      invitee = db.prepare('SELECT id, username, email FROM users WHERE email = ?').get(email);
    } else if (username) {
      invitee = db.prepare('SELECT id, username, email FROM users WHERE username = ?').get(username);
    }

    if (!invitee) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a collaborator
    const existing = db.prepare(
      'SELECT id FROM list_collaborators WHERE list_id = ? AND user_id = ?'
    ).get(id, invitee.id);

    if (existing) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    // Check if invitee is the owner
    const list = db.prepare('SELECT user_id, title FROM lists WHERE id = ?').get(id);
    if (list.user_id === invitee.id) {
      return res.status(400).json({ error: 'Cannot invite the list owner as collaborator' });
    }

    const inviteToken = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    db.prepare(`
      INSERT INTO list_collaborators (list_id, user_id, role, invited_by, invite_token, invite_expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, invitee.id, role, userId, inviteToken, expiresAt.toISOString());

    // Create notification for invitee
    const inviter = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
    createNotification(
      invitee.id,
      'list_invite',
      'List Collaboration Invite',
      `${inviter.username} invited you to collaborate on "${list.title}"`,
      `/lists/${id}?invite=${inviteToken}`
    );

    logActivity(id, userId, 'collaborator_invited', {
      targetUserId: invitee.id,
      role,
      inviteeUsername: invitee.username
    });

    res.json({
      success: true,
      message: 'Invitation sent successfully',
      inviteToken
    });
  } catch (error) {
    console.error('Invite collaborator error:', error);
    res.status(500).json({ error: 'Failed to invite collaborator' });
  }
};

// Accept collaboration invite
export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    const invite = db.prepare(`
      SELECT lc.*, l.title as list_title
      FROM list_collaborators lc
      INNER JOIN lists l ON lc.list_id = l.id
      WHERE lc.invite_token = ? AND lc.user_id = ?
    `).get(token, userId);

    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite' });
    }

    if (invite.accepted_at) {
      return res.status(400).json({ error: 'Invite already accepted' });
    }

    if (new Date(invite.invite_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invite has expired' });
    }

    db.prepare(`
      UPDATE list_collaborators
      SET accepted_at = datetime('now'), invite_token = NULL
      WHERE id = ?
    `).run(invite.id);

    logActivity(invite.list_id, userId, 'collaborator_joined', {});

    // Notify the inviter
    if (invite.invited_by) {
      const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
      createNotification(
        invite.invited_by,
        'collaborator_joined',
        'Collaborator Joined',
        `${user.username} joined your list "${invite.list_title}"`,
        `/lists/${invite.list_id}`
      );
    }

    res.json({
      success: true,
      message: 'Successfully joined the list',
      listId: invite.list_id
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
};

// Remove collaborator
export const removeCollaborator = async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user.id;

    // Check if user is owner or admin, or removing themselves
    const { hasPermission, isOwner } = checkListPermission(id, userId, 'admin');
    const isSelf = parseInt(collaboratorId) === userId;

    if (!hasPermission && !isOwner && !isSelf) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    db.prepare('DELETE FROM list_collaborators WHERE list_id = ? AND user_id = ?')
      .run(id, collaboratorId);

    logActivity(id, userId, 'collaborator_removed', { targetUserId: parseInt(collaboratorId) });

    res.json({ success: true, message: 'Collaborator removed' });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
};

// Update collaborator role
export const updateCollaboratorRole = async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Only owner can change roles
    const list = db.prepare('SELECT user_id FROM lists WHERE id = ?').get(id);
    if (!list || list.user_id !== userId) {
      return res.status(403).json({ error: 'Only the list owner can change roles' });
    }

    db.prepare('UPDATE list_collaborators SET role = ? WHERE list_id = ? AND user_id = ?')
      .run(role, id, collaboratorId);

    logActivity(id, userId, 'collaborator_role_changed', {
      targetUserId: parseInt(collaboratorId),
      newRole: role
    });

    res.json({ success: true, message: 'Role updated' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

// Get list activity log
export const getListActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user?.id;

    const { hasPermission } = checkListPermission(id, userId);
    const list = db.prepare('SELECT user_id, is_public FROM lists WHERE id = ?').get(id);

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    if (!list.is_public && list.user_id !== userId && !hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activities = db.prepare(`
      SELECT la.*, u.username, u.avatar_url
      FROM list_activity_log la
      INNER JOIN users u ON la.user_id = u.id
      WHERE la.list_id = ?
      ORDER BY la.created_at DESC
      LIMIT ? OFFSET ?
    `).all(id, parseInt(limit), parseInt(offset));

    res.json({
      activities: activities.map(a => ({
        ...a,
        metadata: a.metadata ? JSON.parse(a.metadata) : {}
      }))
    });
  } catch (error) {
    console.error('Get list activity error:', error);
    res.status(500).json({ error: 'Failed to get activity' });
  }
};

// Add comment to list
export const addListComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, parentId, movieId } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const { hasPermission } = checkListPermission(id, userId);
    const list = db.prepare('SELECT is_public, user_id FROM lists WHERE id = ?').get(id);

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Allow comments from anyone on public lists, or collaborators on private lists
    if (!list.is_public && list.user_id !== userId && !hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = db.prepare(`
      INSERT INTO list_comments (list_id, user_id, parent_id, comment_text, movie_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, parentId || null, text.trim(), movieId || null);

    const comment = db.prepare(`
      SELECT lc.*, u.username, u.avatar_url
      FROM list_comments lc
      INNER JOIN users u ON lc.user_id = u.id
      WHERE lc.id = ?
    `).get(result.lastInsertRowid);

    logActivity(id, userId, 'comment_added', { commentId: comment.id });

    // Emit to real-time subscribers
    try {
      emitToRoom(`list:${id}`, 'list:comment:added', comment);
    } catch (e) {
      console.warn('Failed to emit comment event:', e.message);
    }

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Add list comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Get list comments
export const getListComments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const list = db.prepare('SELECT is_public, user_id FROM lists WHERE id = ?').get(id);

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    if (!list.is_public && list.user_id !== userId) {
      const { hasPermission } = checkListPermission(id, userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const comments = db.prepare(`
      SELECT lc.*, u.username, u.avatar_url
      FROM list_comments lc
      INNER JOIN users u ON lc.user_id = u.id
      WHERE lc.list_id = ?
      ORDER BY lc.created_at ASC
    `).all(id);

    res.json({ comments });
  } catch (error) {
    console.error('Get list comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
};

// Get lists user is collaborating on
export const getCollaboratingLists = async (req, res) => {
  try {
    const userId = req.user.id;

    const lists = db.prepare(`
      SELECT l.*, lc.role, u.username as owner_username, u.avatar_url as owner_avatar,
        COUNT(DISTINCT lm.id) as movie_count
      FROM list_collaborators lc
      INNER JOIN lists l ON lc.list_id = l.id
      INNER JOIN users u ON l.user_id = u.id
      LEFT JOIN list_movies lm ON l.id = lm.list_id
      WHERE lc.user_id = ? AND lc.accepted_at IS NOT NULL
      GROUP BY l.id
      ORDER BY l.updated_at DESC
    `).all(userId);

    res.json({ lists });
  } catch (error) {
    console.error('Get collaborating lists error:', error);
    res.status(500).json({ error: 'Failed to get lists' });
  }
};

export { checkListPermission, logActivity };

export default {
  getCollaborators,
  inviteCollaborator,
  acceptInvite,
  removeCollaborator,
  updateCollaboratorRole,
  getListActivity,
  addListComment,
  getListComments,
  getCollaboratingLists,
  checkListPermission,
  logActivity,
};
