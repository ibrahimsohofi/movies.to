import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Check, Loader2, AlertTriangle, Film, Sparkles, Users, ListVideo, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
} from '@/services/pushNotifications';

const NOTIFICATION_TYPES = [
  {
    id: 'newReleases',
    label: 'New Releases',
    description: 'Get notified when movies you might like are released',
    icon: Film,
  },
  {
    id: 'recommendations',
    label: 'Recommendations',
    description: 'Personalized movie recommendations based on your taste',
    icon: Sparkles,
  },
  {
    id: 'socialActivity',
    label: 'Social Activity',
    description: 'When someone follows you or interacts with your content',
    icon: Users,
  },
  {
    id: 'listUpdates',
    label: 'List Updates',
    description: 'Updates to collaborative lists you are part of',
    icon: ListVideo,
  },
  {
    id: 'watchlistReminders',
    label: 'Watchlist Reminders',
    description: 'Reminders about movies in your watchlist',
    icon: Bell,
  },
];

export default function NotificationSettings({ className }) {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [preferences, setPreferences] = useState({
    newReleases: true,
    recommendations: true,
    socialActivity: true,
    listUpdates: true,
    watchlistReminders: true,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    initializeSettings();
  }, []);

  async function initializeSettings() {
    setLoading(true);
    setError(null);

    try {
      // Check if push is supported
      const pushSupported = isPushSupported();
      setSupported(pushSupported);

      if (!pushSupported) {
        setLoading(false);
        return;
      }

      // Get current permission status
      setPermission(getPermissionStatus());

      // Check if subscribed
      const isCurrentlySubscribed = await isSubscribed();
      setSubscribed(isCurrentlySubscribed);

      // Get preferences from server
      const prefs = await getNotificationPreferences();
      if (prefs?.preferences) {
        setPreferences(prev => ({ ...prev, ...prefs.preferences }));
      }
    } catch (err) {
      console.error('Error initializing notification settings:', err);
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    setSubscribing(true);
    setError(null);
    setSuccess(null);

    try {
      await subscribeToPush(preferences);
      setSubscribed(true);
      setPermission('granted');
      setSuccess('Successfully subscribed to notifications!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to subscribe to notifications');
    } finally {
      setSubscribing(false);
    }
  }

  async function handleUnsubscribe() {
    setSubscribing(true);
    setError(null);

    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      setSuccess('Successfully unsubscribed from notifications');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError(err.message || 'Failed to unsubscribe');
    } finally {
      setSubscribing(false);
    }
  }

  async function handlePreferenceChange(key, value) {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await updateNotificationPreferences(newPreferences);
    } catch (err) {
      console.error('Error updating preferences:', err);
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !value }));
      setError('Failed to update preference');
    }
  }

  async function handleTestPush() {
    setTestingPush(true);
    setError(null);

    try {
      await sendTestNotification();
      setSuccess('Test notification sent!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Test push error:', err);
      setError('Failed to send test notification');
    } finally {
      setTestingPush(false);
    }
  }

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!supported) {
    return (
      <Card className={cn('border-yellow-500/20', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Push Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser does not support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {subscribed ? (
                <BellRing className="h-5 w-5 text-green-500" />
              ) : (
                <Bell className="h-5 w-5 text-muted-foreground" />
              )}
              Push Notifications
            </CardTitle>
            <CardDescription>
              {subscribed
                ? 'You are subscribed to push notifications'
                : 'Enable push notifications to stay updated'}
            </CardDescription>
          </div>
          <Badge variant={subscribed ? 'default' : 'secondary'}>
            {subscribed ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm flex items-center gap-2">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Permission Status */}
        {permission === 'denied' && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400 text-sm">
            <p className="font-medium">Notifications are blocked</p>
            <p className="text-xs mt-1 opacity-80">
              You need to enable notifications in your browser settings to receive push notifications.
            </p>
          </div>
        )}

        {/* Subscribe/Unsubscribe Button */}
        <div className="flex items-center gap-3">
          {subscribed ? (
            <>
              <Button
                variant="outline"
                onClick={handleUnsubscribe}
                disabled={subscribing}
                className="flex-1"
              >
                {subscribing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BellOff className="h-4 w-4 mr-2" />
                )}
                Unsubscribe
              </Button>
              <Button
                variant="secondary"
                onClick={handleTestPush}
                disabled={testingPush}
              >
                {testingPush ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={subscribing || permission === 'denied'}
              className="w-full"
            >
              {subscribing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BellRing className="h-4 w-4 mr-2" />
              )}
              Enable Notifications
            </Button>
          )}
        </div>

        {/* Notification Preferences */}
        {subscribed && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">Notification Types</h4>
            {NOTIFICATION_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[type.id]}
                    onCheckedChange={(checked) => handlePreferenceChange(type.id, checked)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
