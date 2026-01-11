import webpush from 'web-push';
import { db } from '../config/database.js';
import { getCache, setCache } from '../config/redis.js';

// VAPID keys - generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@movies.to';

// Initialize web-push if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ Web Push configured with VAPID keys');
} else {
  console.log('⚠️  VAPID keys not configured. Push notifications disabled.');
}

// Save push subscription
export async function saveSubscription(userId, subscription, userAgent = null) {
  try {
    const { endpoint, keys } = subscription;
    const deviceType = /mobile|android|iphone/i.test(userAgent || '') ? 'mobile' : 'desktop';

    const existing = db.prepare(`
      SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?
    `).get(userId, endpoint);

    if (existing) {
      db.prepare(`
        UPDATE push_subscriptions
        SET p256dh_key = ?, auth_key = ?, is_active = TRUE, last_used_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(keys.p256dh, keys.auth, existing.id);
    } else {
      db.prepare(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, user_agent, device_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, endpoint, keys.p256dh, keys.auth, userAgent, deviceType);
    }
    return { success: true };
  } catch (error) {
    console.error('Save subscription error:', error);
    throw error;
  }
}

// Remove subscription
export async function removeSubscription(userId, endpoint) {
  try {
    db.prepare(`DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`).run(userId, endpoint);
    return { success: true };
  } catch (error) {
    console.error('Remove subscription error:', error);
    throw error;
  }
}

// Get user subscriptions
export function getUserSubscriptions(userId) {
  try {
    return db.prepare(`SELECT * FROM push_subscriptions WHERE user_id = ? AND is_active = TRUE`).all(userId);
  } catch (error) {
    return [];
  }
}

// Get/update notification preferences
export function getNotificationPreferences(userId) {
  try {
    let prefs = db.prepare(`SELECT * FROM notification_preferences WHERE user_id = ?`).get(userId);
    if (!prefs) {
      db.prepare(`INSERT INTO notification_preferences (user_id) VALUES (?)`).run(userId);
      prefs = { push_enabled: true, new_releases: true, recommendations: true, social_updates: true, list_updates: true };
    }
    return prefs;
  } catch (error) {
    return { push_enabled: true };
  }
}

export function updateNotificationPreferences(userId, preferences) {
  const allowedFields = ['push_enabled', 'email_enabled', 'new_releases', 'recommendations', 'social_updates', 'list_updates'];
  const updates = Object.entries(preferences).filter(([k]) => allowedFields.includes(k));
  if (updates.length === 0) return null;

  const sql = `UPDATE notification_preferences SET ${updates.map(([k]) => `${k} = ?`).join(', ')} WHERE user_id = ?`;
  db.prepare(sql).run(...updates.map(([, v]) => v), userId);
  return getNotificationPreferences(userId);
}

// Send push to user
export async function sendPushToUser(userId, notification) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return { sent: 0, failed: 0 };

  const prefs = getNotificationPreferences(userId);
  if (!prefs?.push_enabled) return { sent: 0, failed: 0 };

  const subscriptions = getUserSubscriptions(userId);
  let sent = 0, failed = 0;

  for (const sub of subscriptions) {
    try {
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/logo.svg',
        badge: '/logo.svg',
        url: notification.url || '/',
        data: notification.data || {},
      });

      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh_key, auth: sub.auth_key }
      }, payload);
      sent++;
    } catch (error) {
      failed++;
      if (error.statusCode === 410 || error.statusCode === 404) {
        db.prepare(`UPDATE push_subscriptions SET is_active = FALSE WHERE id = ?`).run(sub.id);
      }
    }
  }
  return { sent, failed };
}

// Notification helpers
export async function notifyListUpdate(listId, action, data) {
  try {
    const collaborators = db.prepare(`
      SELECT user_id FROM list_collaborators
      WHERE list_id = ? AND user_id != ? AND invite_status = 'accepted'
    `).all(listId, data.actorId);

    const list = db.prepare(`SELECT name FROM lists WHERE id = ?`).get(listId);
    if (!list) return { sent: 0, failed: 0 };

    const notification = {
      title: action === 'movie_added' ? `New Movie in "${list.name}"` : `Update in "${list.name}"`,
      body: `${data.username} ${action === 'movie_added' ? 'added' : 'updated'} "${data.movieTitle}"`,
      url: `/lists/${listId}`,
      data: { type: 'list_update', list_id: listId },
    };

    let totalSent = 0;
    for (const { user_id } of collaborators) {
      const result = await sendPushToUser(user_id, notification);
      totalSent += result.sent;
    }
    return { sent: totalSent, failed: 0 };
  } catch (error) {
    return { sent: 0, failed: 0 };
  }
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

export default {
  saveSubscription,
  removeSubscription,
  getUserSubscriptions,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendPushToUser,
  notifyListUpdate,
  getVapidPublicKey,
};
