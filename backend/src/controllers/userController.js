import db from '../config/database.js';

// Search users by username
export const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }

    const users = db.prepare(
      `SELECT id, username, avatar_url
       FROM users
       WHERE username LIKE ?
       ORDER BY username ASC
       LIMIT ?`
    ).all(`%${q}%`, parseInt(limit));

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// Get user by username
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = db.prepare(
      `SELECT id, username, avatar_url, created_at
       FROM users
       WHERE username = ?`
    ).get(username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};
