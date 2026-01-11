import { db } from '../config/database.js';
import { createNotification } from './notificationController.js';
import { emitNewFollower } from '../config/socket.js';

// Follow a user
export const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;
    const followingId = parseInt(id);

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if user exists
    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(followingId);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existing = db.prepare('SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?').get(followerId, followingId);

    if (existing) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    db.prepare('INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)').run(followerId, followingId);

    // Get follower info
    const followerInfo = db.prepare('SELECT username, avatar_url FROM users WHERE id = ?').get(followerId);

    // Create notification for the followed user
    createNotification(
      followingId,
      'new_follower',
      'New Follower',
      `${followerInfo.username} started following you`,
      `/profile/${followerId}`
    );

    // Emit real-time follower event via WebSocket
    try {
      emitNewFollower(followingId, {
        followerId,
        followerUsername: followerInfo.username,
        followerAvatar: followerInfo.avatar_url,
      });
    } catch (socketError) {
      console.warn('Failed to emit follower event via WebSocket:', socketError.message);
    }

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;
    const followingId = parseInt(id);

    db.prepare('DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?').run(followerId, followingId);

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

// Get user's followers
export const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const followers = db.prepare(`
      SELECT u.id, u.username, u.email, u.avatar, u.bio, uf.created_at as followed_at
      FROM user_follows uf
      INNER JOIN users u ON uf.follower_id = u.id
      WHERE uf.following_id = ?
      ORDER BY uf.created_at DESC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?').get(id);

    res.json({
      followers,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount.count / limit),
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
};

// Get users being followed
export const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const following = db.prepare(`
      SELECT u.id, u.username, u.email, u.avatar, u.bio, uf.created_at as followed_at
      FROM user_follows uf
      INNER JOIN users u ON uf.following_id = u.id
      WHERE uf.follower_id = ?
      ORDER BY uf.created_at DESC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?').get(id);

    res.json({
      following,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount.count / limit),
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to fetch following list' });
  }
};

// Check if following a user
export const isFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;
    const followingId = parseInt(id);

    const isFollowing = db.prepare('SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?').get(followerId, followingId);

    res.json({ isFollowing: !!isFollowing });
  } catch (error) {
    console.error('Check following error:', error);
    res.status(500).json({ error: 'Failed to check following status' });
  }
};

// Get follow stats
export const getFollowStats = async (req, res) => {
  try {
    const { id } = req.params;

    const followers = db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?').get(id);
    const following = db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?').get(id);

    res.json({
      followersCount: followers.count,
      followingCount: following.count,
    });
  } catch (error) {
    console.error('Get follow stats error:', error);
    res.status(500).json({ error: 'Failed to fetch follow stats' });
  }
};
