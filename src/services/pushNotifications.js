// Push Notification Service for Movies.to
import api from './api';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Check if push notifications are supported
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get current permission status
export function getPermissionStatus() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// Request notification permission
export async function requestPermission() {
  if (!isPushSupported()) {
    return { granted: false, error: 'Push notifications are not supported in this browser' };
  }

  try {
    const permission = await Notification.requestPermission();
    return {
      granted: permission === 'granted',
      permission,
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { granted: false, error: error.message };
  }
}

// Get VAPID public key from server
async function getVapidPublicKey() {
  try {
    const response = await api.get('/push/vapid-public-key');
    return response.data.publicKey;
  } catch (error) {
    console.error('Error fetching VAPID public key:', error);
    throw error;
  }
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe to push notifications
export async function subscribeToPush(preferences = {}) {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported');
  }

  const permission = await requestPermission();
  if (!permission.granted) {
    throw new Error('Notification permission denied');
  }

  try {
    // Get the VAPID public key
    const vapidPublicKey = await getVapidPublicKey();

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // If no subscription, create one
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    // Send subscription to server
    const response = await api.post('/push/subscribe', {
      subscription: subscription.toJSON(),
      preferences,
    });

    return {
      success: true,
      subscription: subscription.toJSON(),
      ...response.data,
    };
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe locally
      await subscription.unsubscribe();

      // Notify server
      await api.post('/push/unsubscribe', {
        endpoint: subscription.endpoint,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
}

// Check if currently subscribed
export async function isSubscribed() {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Get notification preferences from server
export async function getNotificationPreferences() {
  try {
    const response = await api.get('/push/preferences');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
}

// Update notification preferences
export async function updateNotificationPreferences(preferences) {
  try {
    const response = await api.put('/push/preferences', { preferences });
    return response.data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

// Send test notification
export async function sendTestNotification() {
  try {
    const response = await api.post('/push/test');
    return response.data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}

// Show local notification (for testing without server)
export async function showLocalNotification(title, options = {}) {
  if (!isPushSupported()) {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  const registration = await navigator.serviceWorker.ready;
  return registration.showNotification(title, {
    body: options.body || '',
    icon: options.icon || '/logo.svg',
    badge: '/logo.svg',
    tag: options.tag || 'local-notification',
    data: options.data || {},
    ...options,
  });
}

export default {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  showLocalNotification,
};
