import { db } from '../config/database.js';
import webpush from 'web-push';

// VAPID keys - in production, these should be environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@movies.to',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

// Get VAPID public key for client
export const getVapidPublicKey = async (req, res) => {
  try {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  } catch (error) {
    console.error('Get VAPID key error:', error);
    res.status(500).json({ error: 'Failed to get VAPID key' });
  }
};

// Subscribe to push notifications
export const subscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription, preferences = {} } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Store subscription in database
    const subscriptionJson = JSON.stringify(subscription);
    const preferencesJson = JSON.stringify({
      newReleases: preferences.newReleases ?? true,
      recommendations: preferences.recommendations ?? true,
      watchlistReminders: preferences.watchlistReminders ?? true,
      socialActivity: preferences.socialActivity ?? true,
      listUpdates: preferences.listUpdates ?? true,
    });

    db.prepare(`
      INSERT OR REPLACE INTO push_subscriptions
      (user_id, endpoint, subscription_data, preferences, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(userId, subscription.endpoint, subscriptionJson, preferencesJson);

    res.json({
      success: true,
      message: 'Successfully subscribed to push notifications'
    });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe to push notifications' });
  }
};

// Unsubscribe from push notifications
export const unsubscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    if (endpoint) {
      db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
        .run(userId, endpoint);
    } else {
      // Unsubscribe all
      db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
    }

    res.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};

// Update notification preferences
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ error: 'Preferences required' });
    }

    const preferencesJson = JSON.stringify(preferences);

    db.prepare(`
      UPDATE push_subscriptions
      SET preferences = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(preferencesJson, userId);

    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Get user's notification preferences
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = db.prepare(`
      SELECT preferences, created_at
      FROM push_subscriptions
      WHERE user_id = ?
      LIMIT 1
    `).get(userId);

    if (!subscription) {
      return res.json({
        subscribed: false,
        preferences: {
          newReleases: true,
          recommendations: true,
          watchlistReminders: true,
          socialActivity: true,
          listUpdates: true,
        }
      });
    }

    res.json({
      subscribed: true,
      preferences: JSON.parse(subscription.preferences),
      subscribedAt: subscription.created_at
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
};

// Send push notification to a specific user
export async function sendPushNotification(userId, notification) {
  try {
    const subscriptions = db.prepare(`
      SELECT subscription_data, preferences
      FROM push_subscriptions
      WHERE user_id = ?
    `).all(userId);

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const results = { sent: 0, failed: 0 };

    for (const sub of subscriptions) {
      try {
        const subscription = JSON.parse(sub.subscription_data);
        const preferences = JSON.parse(sub.preferences || '{}');

        // Check if user wants this type of notification
        if (notification.type && preferences[notification.type] === false) {
          continue;
        }

        await webpush.sendNotification(subscription, JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/logo.svg',
          badge: '/logo.svg',
          tag: notification.tag || 'movies-to',
          data: {
            url: notification.url || '/',
            type: notification.type,
            ...notification.data
          }
        }));

        results.sent++;
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or invalid, remove it
          db.prepare('DELETE FROM push_subscriptions WHERE subscription_data = ?')
            .run(sub.subscription_data);
        }
        results.failed++;
        console.error('Push notification error:', error);
      }
    }

    return results;
  } catch (error) {
    console.error('Send push notification error:', error);
    return { sent: 0, failed: 0, error: error.message };
  }
}

// Send push notification to multiple users
export async function sendBulkPushNotification(userIds, notification) {
  const results = { totalSent: 0, totalFailed: 0 };

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, notification);
    results.totalSent += result.sent;
    results.totalFailed += result.failed;
  }

  return results;
}

// Test push notification (for development)
export const testPush = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await sendPushNotification(userId, {
      title: 'Test Notification',
      body: 'Push notifications are working!',
      type: 'test',
      url: '/'
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Test push error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
};

export default {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  updatePreferences,
  getPreferences,
  sendPushNotification,
  sendBulkPushNotification,
  testPush,
};
