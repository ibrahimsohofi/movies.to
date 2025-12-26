import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, MessageCircle, Heart, UserPlus, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useNotifications, useSocket } from '@/hooks/useSocket';

const NotificationIcon = ({ type }) => {
  const iconClass = "h-4 w-4";
  switch (type) {
    case 'comment_reply':
      return <MessageCircle className={`${iconClass} text-blue-500`} />;
    case 'new_follower':
      return <UserPlus className={`${iconClass} text-green-500`} />;
    case 'list_like':
      return <Heart className={`${iconClass} text-red-500`} />;
    case 'mention':
      return <AtSign className={`${iconClass} text-purple-500`} />;
    default:
      return <Bell className={iconClass} />;
  }
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected } = useSocket();

  // Handle real-time notifications via WebSocket
  const handleNewNotification = useCallback((notification) => {
    console.log('📬 Received new notification via WebSocket:', notification);

    // Add new notification to the list
    setNotifications(prev => [notification, ...prev].slice(0, 5));
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    toast.info(notification.title, {
      description: notification.message,
      action: notification.link ? {
        label: 'View',
        onClick: () => window.location.href = notification.link
      } : undefined,
    });
  }, []);

  // Subscribe to real-time notifications
  useNotifications(handleNewNotification);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=5');
      const notifs = response.data.notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.preventDefault();
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {/* WebSocket connection indicator */}
          {isConnected && (
            <span
              className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-2 border-background"
              title="Real-time notifications active"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${!notification.is_read ? 'bg-muted/50' : ''}`}
                asChild
              >
                <Link
                  to={notification.link || '/notifications'}
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id, new Event('click'));
                    }
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    <NotificationIcon type={notification.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/notifications"
                className="w-full text-center text-sm py-2"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
