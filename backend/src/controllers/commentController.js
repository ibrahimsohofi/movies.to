import db from '../config/database.js';
import { createNotification } from './notificationController.js';
import { emitNewComment } from '../config/socket.js';

// Ensure comment_likes table exists
const ensureCommentLikesTable = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (comment_id, user_id),
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
};

// Ensure comment_reports table exists
const ensureCommentReportsTable = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS comment_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
};

// Extract mentions from comment text
const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
};

// Get comments for a movie
export const getMovieComments = async (req, res) => {
  try {
    const { tmdb_id } = req.params;
    const {
      sortBy = 'newest',
      page = 1,
      limit = 20,
      search = '',
      startDate = '',
      endDate = ''
    } = req.query;

    ensureCommentLikesTable();

    // Build WHERE clause
    let whereConditions = ['m.tmdb_id = ?', 'c.parent_id IS NULL'];
    let params = [tmdb_id];

    // Search in comment text
    if (search) {
      whereConditions.push('c.comment_text LIKE ?');
      params.push(`%${search}%`);
    }

    // Date range filter
    if (startDate) {
      whereConditions.push('DATE(c.created_at) >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('DATE(c.created_at) <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Determine sort order
    let orderClause = 'ORDER BY c.created_at DESC';
    if (sortBy === 'oldest') {
      orderClause = 'ORDER BY c.created_at ASC';
    } else if (sortBy === 'mostLiked') {
      orderClause = 'ORDER BY likes_count DESC, c.created_at DESC';
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM comments c
      JOIN movies m ON c.movie_id = m.id
      WHERE ${whereClause}
    `;
    const { total } = db.prepare(countQuery).get(...params);

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedParams = [...params, parseInt(limit), offset];

    const comments = db.prepare(
      `SELECT c.*, u.username, u.avatar_url,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS likes_count
       FROM comments c
       JOIN movies m ON c.movie_id = m.id
       JOIN users u ON c.user_id = u.id
       WHERE ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`
    ).all(...paginatedParams);

    // Get replies for each comment
    const getReplies = db.prepare(
      `SELECT c.*, u.username, u.avatar_url,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS likes_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.parent_id = ?
       ORDER BY c.created_at ASC`
    );

    // Add user's like status if authenticated
    const userId = req.user?.id;
    const checkUserLike = userId ? db.prepare('SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?') : null;

    for (let comment of comments) {
      comment.replies = getReplies.all(comment.id);
      if (checkUserLike) {
        comment.userHasLiked = !!checkUserLike.get(comment.id, userId);
        // Check likes for replies too
        for (let reply of comment.replies) {
          reply.userHasLiked = !!checkUserLike.get(reply.id, userId);
        }
      }
    }

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: offset + comments.length < total
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
};

// Add comment
export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tmdb_id } = req.params;
    const { comment_text, parent_id } = req.body;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Get movie
    const movie = db.prepare('SELECT id, title FROM movies WHERE tmdb_id = ?').get(tmdb_id);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const movieId = movie.id;

    // Add comment
    const result = db.prepare('INSERT INTO comments (user_id, movie_id, parent_id, comment_text) VALUES (?, ?, ?, ?)')
      .run(userId, movieId, parent_id || null, comment_text);

    // Get created comment with user info
    const newComment = db.prepare(
      `SELECT c.*, u.username, u.avatar_url,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS likes_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    ).get(result.lastInsertRowid);

    // Extract mentions and create notifications
    const mentions = extractMentions(comment_text);
    if (mentions.length > 0) {
      const currentUser = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);

      for (const mentionedUsername of mentions) {
        const mentionedUser = db.prepare('SELECT id FROM users WHERE username = ?').get(mentionedUsername);

        if (mentionedUser && mentionedUser.id !== userId) {
          createNotification(
            mentionedUser.id,
            'mention',
            'New Mention',
            `${currentUser.username} mentioned you in a comment on "${movie.title}"`,
            `/movie/${tmdb_id}`
          );
        }
      }
    }

    // Emit real-time comment event via WebSocket
    try {
      emitNewComment(tmdb_id, newComment);
    } catch (socketError) {
      console.warn('Failed to emit comment via WebSocket:', socketError.message);
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Update comment
export const updateComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const { comment_text } = req.body;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const result = db.prepare('UPDATE comments SET comment_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
      .run(comment_text, commentId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    res.json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    const result = db.prepare('DELETE FROM comments WHERE id = ? AND user_id = ?').run(commentId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// Like comment (one like per user)
export const likeComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    ensureCommentLikesTable();

    const exists = db.prepare('SELECT id FROM comments WHERE id = ?').get(commentId);
    if (!exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Insert like if not exists
    db.prepare('INSERT OR IGNORE INTO comment_likes (comment_id, user_id) VALUES (?, ?)').run(commentId, userId);

    const likes = db.prepare('SELECT COUNT(*) as cnt FROM comment_likes WHERE comment_id = ?').get(commentId);

    res.json({ message: 'Liked', likes_count: likes.cnt });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
};

// Unlike comment
export const unlikeComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    ensureCommentLikesTable();

    const exists = db.prepare('SELECT id FROM comments WHERE id = ?').get(commentId);
    if (!exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Remove like
    db.prepare('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?').run(commentId, userId);

    const likes = db.prepare('SELECT COUNT(*) as cnt FROM comment_likes WHERE comment_id = ?').get(commentId);

    res.json({ message: 'Unliked', likes_count: likes.cnt });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({ error: 'Failed to unlike comment' });
  }
};

// Report a comment
export const reportComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    ensureCommentReportsTable();

    const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user already reported this comment
    const existingReport = db.prepare(
      'SELECT id FROM comment_reports WHERE comment_id = ? AND user_id = ?'
    ).get(commentId, userId);

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this comment' });
    }

    db.prepare(
      'INSERT INTO comment_reports (comment_id, user_id, reason, description) VALUES (?, ?, ?, ?)'
    ).run(commentId, userId, reason, description || null);

    res.json({ message: 'Comment reported successfully' });
  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({ error: 'Failed to report comment' });
  }
};

// Get all comment reports (admin only)
export const getAllCommentReports = async (req, res) => {
  try {
    ensureCommentReportsTable();

    const reports = db.prepare(`
      SELECT cr.*, c.comment_text,
             u1.username as reporter_username,
             u2.username as comment_author_username
      FROM comment_reports cr
      JOIN comments c ON cr.comment_id = c.id
      JOIN users u1 ON cr.user_id = u1.id
      JOIN users u2 ON c.user_id = u2.id
      ORDER BY cr.created_at DESC
    `).all();

    res.json({ reports });
  } catch (error) {
    console.error('Get comment reports error:', error);
    res.status(500).json({ error: 'Failed to get comment reports' });
  }
};

// Update comment report status (admin only)
export const updateCommentReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    ensureCommentReportsTable();

    const result = db.prepare(
      'UPDATE comment_reports SET status = ? WHERE id = ?'
    ).run(status, reportId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Comment report status updated successfully' });
  } catch (error) {
    console.error('Update comment report status error:', error);
    res.status(500).json({ error: 'Failed to update comment report status' });
  }
};
