import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import { Film, Star, UserPlus, Trophy, MessageSquare, Bookmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchActivities();
  }, [page]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/users/me/activity?limit=10&offset=${(page - 1) * 10}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (page === 1) {
        setActivities(data.activities || []);
      } else {
        setActivities(prev => [...prev, ...(data.activities || [])]);
      }

      setHasMore((data.activities || []).length === 10);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'review':
        return { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
      case 'watchlist_add':
        return { icon: Bookmark, color: 'text-purple-400', bg: 'bg-purple-400/10' };
      case 'follow':
        return { icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-400/10' };
      case 'achievement':
        return { icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-400/10' };
      case 'comment':
        return { icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-400/10' };
      default:
        return { icon: Film, color: 'text-gray-400', bg: 'bg-gray-400/10' };
    }
  };

  const renderActivity = (activity) => {
    const { icon: Icon, color, bg } = getActivityIcon(activity.activity_type);

    let content = null;

    switch (activity.activity_type) {
      case 'review':
        content = (
          <div>
            <p className="text-white">
              You reviewed <Link to={`/movie/${activity.data?.movie?.id}`} className="text-red-400 hover:underline">{activity.data?.movie?.title}</Link>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-400">{activity.data?.rating}/10</span>
            </div>
          </div>
        );
        break;

      case 'watchlist_add':
        content = (
          <p className="text-white">
            Added <Link to={`/movie/${activity.data?.id}`} className="text-red-400 hover:underline">{activity.data?.title}</Link> to watchlist
          </p>
        );
        break;

      case 'follow':
        content = (
          <p className="text-white">
            Started following <Link to={`/profile/${activity.data?.username}`} className="text-red-400 hover:underline">{activity.data?.username}</Link>
          </p>
        );
        break;

      case 'achievement':
        content = (
          <div>
            <p className="text-white">Unlocked achievement: <span className="text-orange-400 font-semibold">{activity.data?.name}</span></p>
            <p className="text-sm text-gray-400 mt-1">+{activity.data?.points} points</p>
          </div>
        );
        break;

      default:
        content = <p className="text-white">New activity</p>;
    }

    return (
      <Card key={activity.id} className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <div className="flex gap-4">
          <div className={`${bg} ${color} p-3 rounded-lg h-fit`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            {content}
            <p className="text-xs text-gray-500 mt-2">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </Card>
    );
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700 animate-pulse">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-8 bg-gray-800/50 border-gray-700 text-center">
        <Film className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No activity yet. Start watching and reviewing movies!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map(renderActivity)}

      {hasMore && (
        <Button
          onClick={() => setPage(p => p + 1)}
          variant="outline"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
}
