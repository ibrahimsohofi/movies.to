import db from '../config/database.js';
import { emitNotification } from '../config/socket.js';

// Ensure notifications table exists
const ensureNotificationsTable = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  // Create index for faster queries
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
  `).run();

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
  `).run();
};

// Get user's notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    ensureNotificationsTable();

    let whereClause = 'user_id = ?';
    const params = [userId];

    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = 0';
    }

    // Get total count
    const { total } = db.prepare(
      `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`
    ).get(...params);

    // Get unread count
    const { unread } = db.prepare(
      `SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0`
    ).get(userId);

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const notifications = db.prepare(
      `SELECT * FROM notifications
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params);

    res.json({
      notifications,
      unreadCount: unread,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: offset + notifications.length < total
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    ensureNotificationsTable();

    const result = db.prepare(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
    ).run(notificationId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    ensureNotificationsTable();

    db.prepare(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
    ).run(userId);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    ensureNotificationsTable();

    const result = db.prepare(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?'
    ).run(notificationId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Create notification (helper function, not exposed as route)
export const createNotification = (userId, type, title, message, link = null) => {
  try {
    ensureNotificationsTable();

    const result = db.prepare(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, type, title, message, link);

    // Get the created notification
    const notification = db.prepare(
      'SELECT * FROM notifications WHERE id = ?'
    ).get(result.lastInsertRowid);

    // Emit real-time notification via WebSocket
    try {
      emitNotification(userId, notification);
    } catch (socketError) {
      // Log but don't fail if socket emission fails
      console.warn('Failed to emit notification via WebSocket:', socketError.message);
    }

    return true;
  } catch (error) {
    console.error('Create notification error:', error);
    return false;
  }
};
