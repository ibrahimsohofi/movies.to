import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, MessageCircle, Heart, UserPlus, AtSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { api } from '@/services/api';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import EmptyState from '@/components/common/EmptyState';
import MetaTags from '@/components/common/MetaTags';

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'comment_reply':
      return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case 'new_follower':
      return <UserPlus className="h-5 w-5 text-green-500" />;
    case 'list_like':
      return <Heart className="h-5 w-5 text-red-500" />;
    case 'mention':
      return <AtSign className="h-5 w-5 text-purple-500" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const NotificationCard = ({ notification, onMarkAsRead, onDelete }) => {
  const { t } = useTranslation();

  return (
    <Card className={`p-6 ${notification.is_read ? 'opacity-60' : 'border-primary/50'}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <NotificationIcon type={notification.type} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold mb-1">{notification.title}</h4>
          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(notification.created_at).toLocaleString()}
          </p>

          {/* Link */}
          {notification.link && (
            <Link to={notification.link}>
              <Button variant="link" size="sm" className="px-0 mt-2">
                {t('notifications.viewDetails', 'View Details')} →
              </Button>
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMarkAsRead(notification.id)}
              title={t('notifications.markAsRead')}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(notification.id)}
            title={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(t('notifications.failedToLoad', 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
      toast.success(t('notifications.markedAsRead', 'Marked as read'));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error(t('notifications.failedToUpdate', 'Failed to update notification'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success(t('notifications.allMarkedAsRead', 'All notifications marked as read'));
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(t('notifications.failedToUpdateAll', 'Failed to update notifications'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success(t('notifications.deleted', 'Notification deleted'));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(t('notifications.failedToDelete', 'Failed to delete notification'));
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <MetaTags
        title={`${t('notifications.title')} - Movies.to`}
        description={t('notifications.description', 'Your notifications and updates')}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            {t('notifications.title')}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-lg">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            {t('notifications.stayUpdated', 'Stay updated with your activity and interactions')}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" className="gap-2">
            <Check className="h-4 w-4" />
            {t('notifications.markAllAsRead')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-8">
        <TabsList>
          <TabsTrigger value="all">
            All {notifications.length > 0 && `(${notifications.length})`}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="comment_reply">Comments</TabsTrigger>
          <TabsTrigger value="new_follower">Followers</TabsTrigger>
          <TabsTrigger value="list_like">Likes</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <LoadingIndicator />
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description={
                filter === 'unread'
                  ? "You're all caught up!"
                  : "You don't have any notifications yet"
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
