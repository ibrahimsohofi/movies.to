import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from 'date-fns';
import {
  Activity,
  Film,
  UserPlus,
  UserMinus,
  MessageSquare,
  Shield,
  Eye,
  Users,
  Loader2,
  RefreshCw,
  Filter,
  ChevronDown,
  Bell,
  Sparkles,
  Download,
  User,
  Calendar,
  ChevronRight,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';

const ACTION_CONFIG = {
  movie_added: {
    icon: Film,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'added a movie',
    category: 'movies',
  },
  movie_removed: {
    icon: Film,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'removed a movie',
    category: 'movies',
  },
  collaborator_invited: {
    icon: UserPlus,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'invited a collaborator',
    category: 'collaborators',
  },
  collaborator_joined: {
    icon: Users,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    label: 'joined the list',
    category: 'collaborators',
  },
  collaborator_removed: {
    icon: UserMinus,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    label: 'removed a collaborator',
    category: 'collaborators',
  },
  collaborator_role_changed: {
    icon: Shield,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'changed role',
    category: 'collaborators',
  },
  comment_added: {
    icon: MessageSquare,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
    label: 'commented',
    category: 'comments',
  },
  list_updated: {
    icon: Activity,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    label: 'updated the list',
    category: 'other',
  },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Activity', icon: Activity },
  { value: 'movies', label: 'Movie Changes', icon: Film },
  { value: 'collaborators', label: 'Collaborator Activity', icon: Users },
  { value: 'comments', label: 'Comments', icon: MessageSquare },
];

function getDateLabel(date) {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

function ActivityItem({ activity, isNew, showConnector = true }) {
  const config = ACTION_CONFIG[activity.action_type] || ACTION_CONFIG.list_updated;
  const Icon = config.icon;
  const metadata = activity.metadata || {};

  const getActivityDescription = () => {
    switch (activity.action_type) {
      case 'movie_added':
        return (
          <>
            <span className="font-medium">{activity.username}</span>
            {' added '}
            <span className="font-medium text-foreground">{metadata.movieTitle || 'a movie'}</span>
          </>
        );
      case 'movie_removed':
        return (
          <>
            <span className="font-medium">{activity.username}</span>
            {' removed '}
            <span className="font-medium text-foreground">{metadata.movieTitle || 'a movie'}</span>
          </>
        );
      case 'collaborator_invited':
        return (
          <>
            <span className="font-medium">{activity.username}</span>
            {' invited '}
            <span className="font-medium text-foreground">{metadata.inviteeUsername || 'someone'}</span>
            {' as '}
            <Badge variant="outline" className="text-xs ml-1">
              {metadata.role || 'collaborator'}
            </Badge>
          </>
        );
      case 'collaborator_joined':
        return (
          <>
            <span className="font-medium">{activity.username}</span>
            {' joined the list'}
          </>
        );
      case 'collaborator_removed':
        return (
          <>
            <span className="font-medium">{activity.username}</span>
            {' removed '}
            <span className="font-medium text-foreground">{metadata.removedUsername || 'a collaborator'}</span>
          </>
        );
      case 'collaborator_role_changed':
        return (
          <>
            <span className="font-medium">{metadata.targetUsername || activity.username}</span>
            {' role changed to '}
            <Badge variant="outline" className="text-xs ml-1">
              {metadata.newRole}
            </Badge>
          </>
        );
      case 'comment_added':
        return (
          <>
            <span className="font-medium">{activity.username}</span>
            {' commented'}
            {metadata.movieTitle && (
              <> on <span className="font-medium text-foreground">{metadata.movieTitle}</span></>
            )}
          </>
        );
      default:
        return (
          <>
            <span className="font-medium">{activity.username}</span>
            {' '}
            {config.label}
          </>
        );
    }
  };

  return (
    <div className="relative flex gap-3">
      {/* Timeline connector */}
      {showConnector && (
        <div className="absolute left-[15px] top-10 bottom-0 w-px bg-border" />
      )}

      <div
        className={cn(
          'relative flex items-start gap-3 py-3 px-3 rounded-lg transition-all duration-500 flex-1',
          'border border-transparent',
          isNew && 'animate-in slide-in-from-top-2 fade-in-0 bg-primary/5 border-primary/20',
          !isNew && 'hover:bg-muted/30'
        )}
      >
        <div className={cn(
          'p-2 rounded-full transition-transform z-10 bg-background',
          config.bgColor,
          isNew && 'animate-pulse scale-110'
        )}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Avatar className="h-5 w-5">
              <AvatarImage src={activity.avatar_url} />
              <AvatarFallback className="text-xs">
                {(activity.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">
              {getActivityDescription()}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-muted-foreground">
              {format(new Date(activity.created_at), 'h:mm a')}
            </p>
            {isNew && (
              <Badge variant="secondary" className="text-xs gap-1 animate-pulse">
                <Sparkles className="h-3 w-3" />
                New
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DateGroupHeader({ date }) {
  return (
    <div className="flex items-center gap-3 py-3 sticky top-0 bg-background/95 backdrop-blur z-20">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">{getDateLabel(date)}</span>
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function ListActivityFeed({
  listId,
  maxHeight = 400,
  limit = 20,
  showHeader = true,
  className,
  compact = false,
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [newActivityIds, setNewActivityIds] = useState(new Set());
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
  const [groupByDate, setGroupByDate] = useState(true);
  const [uniqueUsers, setUniqueUsers] = useState([]);

  const scrollAreaRef = useRef(null);
  const { socket, isConnected } = useSocket();

  // Fetch activities
  const fetchActivities = useCallback(async (pageNum = 1, append = false) => {
    try {
      const response = await api.get(`/lists/${listId}/activity`, {
        params: { limit, page: pageNum },
      });
      const newActivities = response.data.activities || [];

      if (append) {
        setActivities(prev => [...prev, ...newActivities]);
      } else {
        setActivities(newActivities);
      }

      // Extract unique users for filtering
      const users = new Map();
      [...(append ? activities : []), ...newActivities].forEach(a => {
        if (a.user_id && a.username) {
          users.set(a.user_id, { id: a.user_id, username: a.username, avatar_url: a.avatar_url });
        }
      });
      setUniqueUsers(Array.from(users.values()));

      setHasMore(newActivities.length === limit);
      setError(null);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [listId, limit, activities]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchActivities(1, false);
  }, [listId]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket || !listId || !liveUpdatesEnabled) return;

    const socketInstance = socket.getSocket();
    if (!socketInstance) return;

    socketInstance.emit('list:activity:join', { listId });

    const handleNewActivity = (activity) => {
      setActivities(prev => {
        if (prev.find(a => a.id === activity.id)) return prev;
        return [activity, ...prev];
      });

      setNewActivityIds(prev => new Set([...prev, activity.id]));
      setTimeout(() => {
        setNewActivityIds(prev => {
          const next = new Set(prev);
          next.delete(activity.id);
          return next;
        });
      }, 5000);
    };

    socketInstance.on('list:activity:new', handleNewActivity);

    return () => {
      socketInstance.emit('list:activity:leave', { listId });
      socketInstance.off('list:activity:new', handleNewActivity);
    };
  }, [socket, listId, liveUpdatesEnabled]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchActivities(1, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage, true);
  };

  const handleExport = () => {
    const data = filteredActivities.map(a => ({
      date: format(new Date(a.created_at), 'yyyy-MM-dd HH:mm:ss'),
      user: a.username,
      action: ACTION_CONFIG[a.action_type]?.label || a.action_type,
      details: JSON.stringify(a.metadata || {}),
    }));

    const csv = [
      ['Date', 'User', 'Action', 'Details'].join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `list-activity-${listId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (filter !== 'all') {
      const config = ACTION_CONFIG[activity.action_type];
      if (config?.category !== filter) return false;
    }
    if (userFilter !== 'all' && activity.user_id !== userFilter) return false;
    return true;
  });

  // Group activities by date
  const groupedActivities = groupByDate
    ? filteredActivities.reduce((groups, activity) => {
        const date = new Date(activity.created_at);
        const dateKey = format(date, 'yyyy-MM-dd');
        if (!groups[dateKey]) {
          groups[dateKey] = { date, activities: [] };
        }
        groups[dateKey].activities.push(activity);
        return groups;
      }, {})
    : null;

  const activeFilterLabel = FILTER_OPTIONS.find(f => f.value === filter)?.label || 'All Activity';
  const activeUserLabel = userFilter === 'all' ? 'All Users' : uniqueUsers.find(u => u.id === userFilter)?.username || 'User';

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-destructive/20', className)}>
        <CardContent className="py-6 text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-destructive/50" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-3">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-blue-500" />
                Activity
                {isConnected && liveUpdatesEnabled && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
                {filter !== 'all' && ` (${activeFilterLabel})`}
                {userFilter !== 'all' && ` by ${activeUserLabel}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Live updates toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLiveUpdatesEnabled(!liveUpdatesEnabled)}
                className={cn(
                  liveUpdatesEnabled && isConnected
                    ? 'text-green-500 hover:text-green-600'
                    : 'text-muted-foreground'
                )}
                title={liveUpdatesEnabled ? 'Live updates enabled' : 'Live updates disabled'}
              >
                <Bell className={cn('h-4 w-4', liveUpdatesEnabled && isConnected && 'animate-pulse')} />
              </Button>

              {/* User filter */}
              {uniqueUsers.length > 1 && (
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[130px] h-8">
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="text-[10px]">{user.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {user.username}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Category filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8">
                    <Filter className="h-3.5 w-3.5" />
                    {!compact && activeFilterLabel}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter Activity</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {FILTER_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={filter === option.value}
                        onCheckedChange={() => setFilter(option.value)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={groupByDate}
                    onCheckedChange={setGroupByDate}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Group by date
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Refresh button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 w-8"
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Active filters */}
          {(filter !== 'all' || userFilter !== 'all') && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {filter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {activeFilterLabel}
                  <button onClick={() => setFilter('all')} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {userFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {activeUserLabel}
                  <button onClick={() => setUserFilter('all')} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={showHeader ? 'pt-0' : ''}>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {filter === 'all' && userFilter === 'all' ? 'No activity yet' : 'No matching activities'}
            </p>
            {(filter !== 'all' || userFilter !== 'all') && (
              <Button
                variant="link"
                size="sm"
                onClick={() => { setFilter('all'); setUserFilter('all'); }}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea ref={scrollAreaRef} style={{ maxHeight }} className="pr-2">
            {groupByDate && groupedActivities ? (
              <div className="space-y-1">
                {Object.entries(groupedActivities).map(([dateKey, group], groupIndex) => (
                  <div key={dateKey}>
                    <DateGroupHeader date={group.date} />
                    {group.activities.map((activity, actIndex) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        isNew={newActivityIds.has(activity.id)}
                        showConnector={actIndex < group.activities.length - 1}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredActivities.map((activity, index) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isNew={newActivityIds.has(activity.id)}
                    showConnector={index < filteredActivities.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Load more button */}
            {hasMore && filter === 'all' && userFilter === 'all' && (
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
