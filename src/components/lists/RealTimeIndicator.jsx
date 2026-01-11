import { useState, useEffect, useMemo } from 'react';
import {
  Circle,
  Users,
  Wifi,
  WifiOff,
  Edit3,
  Plus,
  Trash2,
  MessageSquare,
  Eye,
  Loader2,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  MousePointer2,
  Move,
  Search,
  Star,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';

// Action type configurations
const ACTION_TYPES = {
  viewing: {
    icon: Eye,
    label: 'viewing',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400',
    priority: 0,
  },
  browsing: {
    icon: Search,
    label: 'browsing movies',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500',
    priority: 1,
  },
  adding_movie: {
    icon: Plus,
    label: 'adding a movie',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    priority: 3,
  },
  removing_movie: {
    icon: Trash2,
    label: 'removing a movie',
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    priority: 3,
  },
  editing: {
    icon: Edit3,
    label: 'editing',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    priority: 2,
  },
  commenting: {
    icon: MessageSquare,
    label: 'typing a comment',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
    priority: 2,
  },
  rating: {
    icon: Star,
    label: 'rating a movie',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    priority: 2,
  },
  reordering: {
    icon: Move,
    label: 'reordering movies',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500',
    priority: 2,
  },
};

// Connection quality levels
const CONNECTION_QUALITY = {
  excellent: { icon: SignalHigh, label: 'Excellent', color: 'text-green-500' },
  good: { icon: SignalMedium, label: 'Good', color: 'text-green-400' },
  fair: { icon: SignalLow, label: 'Fair', color: 'text-yellow-500' },
  poor: { icon: Signal, label: 'Poor', color: 'text-red-500' },
};

// User avatar with action indicator
function UserAvatarWithAction({ user, showAction = true, size = 'default' }) {
  const action = ACTION_TYPES[user.currentAction] || ACTION_TYPES.viewing;
  const ActionIcon = action.icon;
  const isActive = user.currentAction && user.currentAction !== 'viewing';

  const sizeClasses = {
    small: 'h-6 w-6',
    default: 'h-7 w-7',
    large: 'h-9 w-9',
  };

  return (
    <div className="relative">
      <Avatar
        className={cn(
          'border-2 border-background transition-all',
          sizeClasses[size],
          isActive && 'ring-2 ring-offset-1 ring-offset-background',
          isActive && action.color.replace('text-', 'ring-')
        )}
      >
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
          {(user.username || 'U').charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {showAction && isActive && (
        <div
          className={cn(
            'absolute -bottom-1 -right-1 p-0.5 rounded-full',
            action.bgColor,
            'animate-pulse'
          )}
        >
          <ActionIcon className="h-2.5 w-2.5 text-white" />
        </div>
      )}
      {/* Online indicator */}
      {!isActive && (
        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
      )}
    </div>
  );
}

// Typing indicator dots
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1 h-1 bg-current rounded-full animate-bounce" />
    </span>
  );
}

// Connection quality indicator
function ConnectionQualityIndicator({ quality, latency }) {
  const config = CONNECTION_QUALITY[quality] || CONNECTION_QUALITY.good;
  const QualityIcon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1">
          <QualityIcon className={cn('h-3.5 w-3.5', config.color)} />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <p className="font-medium">Connection: {config.label}</p>
          {latency && <p className="text-muted-foreground">Latency: {latency}ms</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Active user card for hover
function ActiveUserCard({ user, showCursor = false }) {
  const action = ACTION_TYPES[user.currentAction] || ACTION_TYPES.viewing;
  const ActionIcon = action.icon;
  const isActive = user.currentAction && user.currentAction !== 'viewing';

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <UserAvatarWithAction user={user} showAction={false} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{user.username}</p>
          {user.role && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {user.role}
            </Badge>
          )}
        </div>
        <p className={cn('text-xs flex items-center gap-1', action.color)}>
          <ActionIcon className="h-3 w-3" />
          {isActive ? (
            <>
              {action.label}
              {user.currentAction === 'commenting' && <TypingDots />}
            </>
          ) : (
            'Currently viewing'
          )}
        </p>
        {user.location && (
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <MousePointer2 className="h-2.5 w-2.5" />
            {user.location}
          </p>
        )}
      </div>
      {isActive && (
        <div className="relative">
          <span className="flex h-2 w-2">
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', action.bgColor)} />
            <span className={cn('relative inline-flex rounded-full h-2 w-2', action.bgColor)} />
          </span>
        </div>
      )}
    </div>
  );
}

// Recent activity mini feed
function RecentActivityMini({ activities }) {
  if (!activities || activities.length === 0) return null;

  return (
    <div className="space-y-1 mt-2 pt-2 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground mb-1">Recent Activity</p>
      {activities.slice(0, 3).map((activity, i) => (
        <p key={i} className="text-xs text-muted-foreground truncate">
          <span className="font-medium">{activity.username}</span> {activity.action}
        </p>
      ))}
    </div>
  );
}

export default function RealTimeIndicator({ listId, className, compact = false, showQuality = true }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [recentActivity, setRecentActivity] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [latency, setLatency] = useState(null);
  const { socket, isConnected: socketConnected } = useSocket();

  useEffect(() => {
    if (!socket || !listId) return;

    const socketInstance = socket.getSocket();
    if (!socketInstance) return;

    setIsConnected(socketConnected);

    // Join the list room
    socketInstance.emit('list:join', { listId });

    // Listen for online users updates
    socketInstance.on('list:users:update', (users) => {
      setOnlineUsers(users || []);
    });

    // Listen for user joined
    socketInstance.on('list:user:joined', (user) => {
      setOnlineUsers((prev) => {
        if (prev.find((u) => u.id === user.id)) return prev;
        return [...prev, { ...user, currentAction: 'viewing' }];
      });
      setRecentActivity({ type: 'joined', user, timestamp: Date.now() });
      addRecentActivity({ username: user.username, action: 'joined' });
    });

    // Listen for user left
    socketInstance.on('list:user:left', (user) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
      addRecentActivity({ username: user.username, action: 'left' });
    });

    // Listen for user action updates
    socketInstance.on('list:user:action', ({ userId, action, location }) => {
      setOnlineUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, currentAction: action, location } : u))
      );
    });

    // Listen for activity (movie added, etc.)
    socketInstance.on('list:activity', (activity) => {
      setRecentActivity({ ...activity, timestamp: Date.now() });
      addRecentActivity({ username: activity.username, action: activity.actionLabel || activity.type });
      setTimeout(() => {
        setRecentActivity((prev) =>
          prev?.timestamp === activity.timestamp ? null : prev
        );
      }, 5000);
    });

    // Listen for connection quality updates
    socketInstance.on('connection:quality', ({ quality, latency: lat }) => {
      setConnectionQuality(quality);
      setLatency(lat);
    });

    // Listen for reconnection events
    socketInstance.on('reconnecting', () => {
      setIsReconnecting(true);
    });

    socketInstance.on('reconnect', () => {
      setIsReconnecting(false);
      setIsConnected(true);
    });

    // Cleanup
    return () => {
      socketInstance.emit('list:leave', { listId });
      socketInstance.off('list:users:update');
      socketInstance.off('list:user:joined');
      socketInstance.off('list:user:left');
      socketInstance.off('list:user:action');
      socketInstance.off('list:activity');
      socketInstance.off('connection:quality');
      socketInstance.off('reconnecting');
      socketInstance.off('reconnect');
    };
  }, [socket, listId, socketConnected]);

  const addRecentActivity = (activity) => {
    setRecentActivities(prev => [activity, ...prev].slice(0, 10));
  };

  // Update connection status
  useEffect(() => {
    setIsConnected(socketConnected);
  }, [socketConnected]);

  // Memoized counts
  const { activeUsers, viewingUsers, displayedUsers, remainingCount } = useMemo(() => {
    const active = onlineUsers.filter(
      (u) => u.currentAction && u.currentAction !== 'viewing'
    ).sort((a, b) => {
      const aPriority = ACTION_TYPES[a.currentAction]?.priority || 0;
      const bPriority = ACTION_TYPES[b.currentAction]?.priority || 0;
      return bPriority - aPriority;
    });
    const viewing = onlineUsers.filter(
      (u) => !u.currentAction || u.currentAction === 'viewing'
    );
    const displayed = onlineUsers.slice(0, compact ? 2 : 4);
    const remaining = Math.max(0, onlineUsers.length - displayed.length);
    return {
      activeUsers: active,
      viewingUsers: viewing,
      displayedUsers: displayed,
      remainingCount: remaining,
    };
  }, [onlineUsers, compact]);

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-2', className)}>
          {/* Connection indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                {isReconnecting ? (
                  <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
                ) : isConnected ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                ) : (
                  <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isReconnecting ? 'Reconnecting...' : isConnected ? 'Connected' : 'Connecting...'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Online count */}
          {onlineUsers.length > 0 && (
            <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0.5">
              <Users className="h-3 w-3" />
              {onlineUsers.length}
            </Badge>
          )}

          {showQuality && isConnected && (
            <ConnectionQualityIndicator quality={connectionQuality} latency={latency} />
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-3', className)}>
        {/* Connection Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md',
              isConnected ? 'bg-green-500/10' : isReconnecting ? 'bg-yellow-500/10' : 'bg-muted/50'
            )}>
              {isReconnecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 text-yellow-500 animate-spin" />
                  <span className="text-xs text-yellow-500 font-medium">Reconnecting</span>
                </>
              ) : isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <Wifi className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs text-green-500 font-medium">Live</span>
                  {showQuality && (
                    <ConnectionQualityIndicator quality={connectionQuality} latency={latency} />
                  )}
                </>
              ) : (
                <>
                  <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                  <span className="text-xs text-muted-foreground">Connecting</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p className="font-medium">
                {isReconnecting ? 'Attempting to reconnect...' : isConnected ? 'Real-time updates enabled' : 'Connecting to server...'}
              </p>
              {isConnected && latency && <p className="text-muted-foreground">Latency: {latency}ms</p>}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Recent Activity Indicator */}
        {recentActivity && recentActivity.type !== 'joined' && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 animate-in slide-in-from-right-2 fade-in-0">
            <span className="text-xs text-primary">
              {recentActivity.username}{' '}
              {recentActivity.type === 'movie_added' && 'added a movie'}
              {recentActivity.type === 'movie_removed' && 'removed a movie'}
              {recentActivity.type === 'comment_added' && 'commented'}
            </span>
          </div>
        )}

        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <div className="flex items-center cursor-pointer">
                <div className="flex -space-x-2">
                  {displayedUsers.map((user) => (
                    <Tooltip key={user.id}>
                      <TooltipTrigger asChild>
                        <div>
                          <UserAvatarWithAction user={user} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.currentAction && user.currentAction !== 'viewing'
                            ? ACTION_TYPES[user.currentAction]?.label
                            : 'Viewing'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {remainingCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <span className="text-xs text-muted-foreground font-medium">
                            +{remainingCount}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {remainingCount} more {remainingCount === 1 ? 'person' : 'people'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <Badge variant="outline" className="ml-2 gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  {onlineUsers.length} online
                </Badge>
              </div>
            </HoverCardTrigger>
            <HoverCardContent align="end" className="w-72">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Online Now
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {activeUsers.length > 0
                    ? `${activeUsers.length} ${activeUsers.length === 1 ? 'person is' : 'people are'} actively editing`
                    : 'Everyone is just viewing'}
                </p>

                {/* Activity breakdown */}
                {activeUsers.length > 0 && (
                  <div className="mb-3">
                    <Progress
                      value={(activeUsers.length / onlineUsers.length) * 100}
                      className="h-1.5"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {activeUsers.length} active / {viewingUsers.length} viewing
                    </p>
                  </div>
                )}

                <div className="space-y-1 max-h-48 overflow-auto">
                  {onlineUsers.map((user) => (
                    <ActiveUserCard key={user.id} user={user} />
                  ))}
                </div>

                <RecentActivityMini activities={recentActivities} />
              </div>
            </HoverCardContent>
          </HoverCard>
        )}

        {/* Empty state */}
        {onlineUsers.length === 0 && isConnected && (
          <span className="text-xs text-muted-foreground">
            Only you are viewing this list
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}

// Hook to emit user actions
export function useListActions(listId) {
  const { socket } = useSocket();

  const emitAction = (action, location = null) => {
    const socketInstance = socket?.getSocket();
    if (socketInstance && listId) {
      socketInstance.emit('list:user:action', { listId, action, location });
    }
  };

  return {
    startAddingMovie: () => emitAction('adding_movie'),
    stopAddingMovie: () => emitAction('viewing'),
    startRemovingMovie: () => emitAction('removing_movie'),
    stopRemovingMovie: () => emitAction('viewing'),
    startEditing: () => emitAction('editing'),
    stopEditing: () => emitAction('viewing'),
    startCommenting: () => emitAction('commenting'),
    stopCommenting: () => emitAction('viewing'),
    startBrowsing: () => emitAction('browsing'),
    stopBrowsing: () => emitAction('viewing'),
    startRating: () => emitAction('rating'),
    stopRating: () => emitAction('viewing'),
    startReordering: () => emitAction('reordering'),
    stopReordering: () => emitAction('viewing'),
    updateLocation: (location) => emitAction(null, location),
  };
}
