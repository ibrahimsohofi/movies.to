import { db } from '../config/database.js';

// Create an activity
export const createActivity = (userId, activityType, metadata = {}) => {
  try {
    db.prepare(`
      INSERT INTO activities (user_id, activity_type, movie_id, list_id, review_id, comment_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      activityType,
      metadata.movie_id || null,
      metadata.list_id || null,
      metadata.review_id || null,
      metadata.comment_id || null,
      JSON.stringify(metadata)
    );
  } catch (error) {
    console.error('Create activity error:', error);
  }
};

// Get personalized feed
export const getPersonalizedFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get activities from users being followed
    const activities = db.prepare(`
      SELECT a.*,
        u.username, u.avatar,
        json(a.metadata) as meta
      FROM activities a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.user_id IN (
        SELECT following_id FROM user_follows WHERE follower_id = ?
      )
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    // Parse metadata
    const parsedActivities = activities.map(a => ({
      ...a,
      metadata: a.meta ? JSON.parse(a.meta) : {}
    }));

    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM activities
      WHERE user_id IN (SELECT following_id FROM user_follows WHERE follower_id = ?)
    `).get(userId);

    res.json({
      activities: parsedActivities,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount.count / limit),
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    console.error('Get personalized feed error:', error);
    res.status(500).json({ error: 'Failed to fetch personalized feed' });
  }
};

// Get following activities
export const getFollowingFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const activities = db.prepare(`
      SELECT a.*,
        u.username, u.avatar,
        json(a.metadata) as meta
      FROM activities a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.user_id IN (
        SELECT following_id FROM user_follows WHERE follower_id = ?
      )
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    const parsedActivities = activities.map(a => ({
      ...a,
      metadata: a.meta ? JSON.parse(a.meta) : {}
    }));

    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM activities
      WHERE user_id IN (SELECT following_id FROM user_follows WHERE follower_id = ?)
    `).get(userId);

    res.json({
      activities: parsedActivities,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount.count / limit),
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    console.error('Get following feed error:', error);
    res.status(500).json({ error: 'Failed to fetch following feed' });
  }
};

// Get trending activities
export const getTrendingFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get recent popular activities (last 7 days)
    const activities = db.prepare(`
      SELECT a.*,
        u.username, u.avatar,
        json(a.metadata) as meta,
        (
          SELECT COUNT(*) FROM list_likes ll
          WHERE ll.list_id = a.list_id
        ) as interaction_count
      FROM activities a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.created_at >= datetime('now', '-7 days')
      ORDER BY interaction_count DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const parsedActivities = activities.map(a => ({
      ...a,
      metadata: a.meta ? JSON.parse(a.meta) : {}
    }));

    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM activities
      WHERE created_at >= datetime('now', '-7 days')
    `).get();

    res.json({
      activities: parsedActivities,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount.count / limit),
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    console.error('Get trending feed error:', error);
    res.status(500).json({ error: 'Failed to fetch trending feed' });
  }
};

// Get user's activities
export const getUserActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const activities = db.prepare(`
      SELECT a.*,
        u.username, u.avatar,
        json(a.metadata) as meta
      FROM activities a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

    const parsedActivities = activities.map(a => ({
      ...a,
      metadata: a.meta ? JSON.parse(a.meta) : {}
    }));

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM activities WHERE user_id = ?').get(id);

    res.json({
      activities: parsedActivities,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount.count / limit),
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ error: 'Failed to fetch user activities' });
  }
};
