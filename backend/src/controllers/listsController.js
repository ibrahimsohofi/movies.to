import { db } from '../config/database.js';
import { createNotification } from './notificationController.js';
import { emitListLike } from '../config/socket.js';

// Create a new list
export const createList = async (req, res) => {
  try {
    const { title, description, is_public = true } = req.body;
    const userId = req.user.id;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = db.prepare(
      'INSERT INTO lists (user_id, title, description, is_public) VALUES (?, ?, ?, ?)'
    ).run(userId, title, description || null, is_public ? 1 : 0);

    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ list });
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ error: 'Failed to create list' });
  }
};

// Get user's lists
export const getUserLists = async (req, res) => {
  try {
    const userId = req.user.id;

    const lists = db.prepare(`
      SELECT l.*,
        COUNT(DISTINCT lm.id) as movie_count,
        COUNT(DISTINCT ll.id) as like_count
      FROM lists l
      LEFT JOIN list_movies lm ON l.id = lm.list_id
      LEFT JOIN list_likes ll ON l.id = ll.list_id
      WHERE l.user_id = ?
      GROUP BY l.id
      ORDER BY l.updated_at DESC
    `).all(userId);

    res.json({ lists });
  } catch (error) {
    console.error('Get user lists error:', error);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
};

// Get public lists (discover)
export const getPublicLists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const lists = db.prepare(`
      SELECT l.*,
        u.username, u.avatar,
        COUNT(DISTINCT lm.id) as movie_count,
        COUNT(DISTINCT ll.id) as like_count
      FROM lists l
      INNER JOIN users u ON l.user_id = u.id
      LEFT JOIN list_movies lm ON l.id = lm.list_id
      LEFT JOIN list_likes ll ON l.id = ll.list_id
      WHERE l.is_public = 1
      GROUP BY l.id
      ORDER BY like_count DESC, l.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM lists WHERE is_public = 1').get();

    res.json({
      lists,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount.count / limit),
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    console.error('Get public lists error:', error);
    res.status(500).json({ error: 'Failed to fetch public lists' });
  }
};

// Get single list details
export const getListDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const list = db.prepare(`
      SELECT l.*,
        u.username, u.avatar,
        COUNT(DISTINCT ll.id) as like_count
      FROM lists l
      INNER JOIN users u ON l.user_id = u.id
      LEFT JOIN list_likes ll ON l.id = ll.list_id
      WHERE l.id = ?
      GROUP BY l.id
    `).get(id);

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Check if user has access (public or owner)
    if (!list.is_public && list.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get movies in list
    const movies = db.prepare(`
      SELECT lm.*, lm.movie_data as data
      FROM list_movies lm
      WHERE lm.list_id = ?
      ORDER BY lm.position ASC, lm.added_at DESC
    `).all(id);

    // Parse movie_data JSON
    const parsedMovies = movies.map(m => ({
      ...m,
      data: m.data ? JSON.parse(m.data) : null
    }));

    // Check if user liked this list
    const userLiked = userId
      ? db.prepare('SELECT id FROM list_likes WHERE list_id = ? AND user_id = ?').get(id, userId)
      : null;

    res.json({
      list: {
        ...list,
        movies: parsedMovies,
        userLiked: !!userLiked,
      },
    });
  } catch (error) {
    console.error('Get list details error:', error);
    res.status(500).json({ error: 'Failed to fetch list details' });
  }
};

// Update list
export const updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_public } = req.body;
    const userId = req.user.id;

    const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(id, userId);

    if (!list) {
      return res.status(404).json({ error: 'List not found or access denied' });
    }

    db.prepare(
      'UPDATE lists SET title = ?, description = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(title || list.title, description !== undefined ? description : list.description, is_public !== undefined ? (is_public ? 1 : 0) : list.is_public, id);

    const updatedList = db.prepare('SELECT * FROM lists WHERE id = ?').get(id);

    res.json({ list: updatedList });
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({ error: 'Failed to update list' });
  }
};

// Delete list
export const deleteList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(id, userId);

    if (!list) {
      return res.status(404).json({ error: 'List not found or access denied' });
    }

    db.prepare('DELETE FROM lists WHERE id = ?').run(id);

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ error: 'Failed to delete list' });
  }
};

// Add movie to list
export const addMovieToList = async (req, res) => {
  try {
    const { id } = req.params;
    const { tmdb_id, movie_data } = req.body;
    const userId = req.user.id;

    const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(id, userId);

    if (!list) {
      return res.status(404).json({ error: 'List not found or access denied' });
    }

    // Check if movie already in list
    const existing = db.prepare('SELECT id FROM list_movies WHERE list_id = ? AND tmdb_id = ?').get(id, tmdb_id);

    if (existing) {
      return res.status(400).json({ error: 'Movie already in list' });
    }

    // Get max position
    const maxPos = db.prepare('SELECT MAX(position) as max FROM list_movies WHERE list_id = ?').get(id);
    const position = (maxPos?.max || 0) + 1;

    const result = db.prepare(
      'INSERT INTO list_movies (list_id, tmdb_id, movie_data, position) VALUES (?, ?, ?, ?)'
    ).run(id, tmdb_id, JSON.stringify(movie_data), position);

    // Update list timestamp
    db.prepare('UPDATE lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    res.status(201).json({ message: 'Movie added to list', movieId: result.lastInsertRowid });
  } catch (error) {
    console.error('Add movie to list error:', error);
    res.status(500).json({ error: 'Failed to add movie to list' });
  }
};

// Remove movie from list
export const removeMovieFromList = async (req, res) => {
  try {
    const { id, movieId } = req.params;
    const userId = req.user.id;

    const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(id, userId);

    if (!list) {
      return res.status(404).json({ error: 'List not found or access denied' });
    }

    db.prepare('DELETE FROM list_movies WHERE list_id = ? AND id = ?').run(id, movieId);

    // Update list timestamp
    db.prepare('UPDATE lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    res.json({ message: 'Movie removed from list' });
  } catch (error) {
    console.error('Remove movie from list error:', error);
    res.status(500).json({ error: 'Failed to remove movie from list' });
  }
};

// Like a list
export const likeList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const list = db.prepare('SELECT * FROM lists WHERE id = ? AND is_public = 1').get(id);

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Check if already liked
    const existing = db.prepare('SELECT id FROM list_likes WHERE list_id = ? AND user_id = ?').get(id, userId);

    if (existing) {
      return res.status(400).json({ error: 'Already liked this list' });
    }

    db.prepare('INSERT INTO list_likes (list_id, user_id) VALUES (?, ?)').run(id, userId);

    // Get liker info
    const likerInfo = db.prepare('SELECT username, avatar_url FROM users WHERE id = ?').get(userId);

    // Create notification for list owner (if not liking own list)
    if (list.user_id !== userId) {
      createNotification(
        list.user_id,
        'list_like',
        'List Liked',
        `${likerInfo.username} liked your list "${list.title}"`,
        `/lists/${id}`
      );

      // Emit real-time list like event via WebSocket
      try {
        emitListLike(list.user_id, {
          listId: id,
          listTitle: list.title,
          likerUsername: likerInfo.username,
          likerAvatar: likerInfo.avatar_url,
        });
      } catch (socketError) {
        console.warn('Failed to emit list like event via WebSocket:', socketError.message);
      }
    }

    res.json({ message: 'List liked successfully' });
  } catch (error) {
    console.error('Like list error:', error);
    res.status(500).json({ error: 'Failed to like list' });
  }
};

// Unlike a list
export const unlikeList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    db.prepare('DELETE FROM list_likes WHERE list_id = ? AND user_id = ?').run(id, userId);

    res.json({ message: 'List unliked successfully' });
  } catch (error) {
    console.error('Unlike list error:', error);
    res.status(500).json({ error: 'Failed to unlike list' });
  }
};
