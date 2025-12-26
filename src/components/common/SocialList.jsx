import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function SocialList({ userId, type = 'followers' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { token, user: currentUser } = useAuthStore();
  const [followStates, setFollowStates] = useState({});

  useEffect(() => {
    fetchUsers();
  }, [userId, type, page]);

  const fetchUsers = async () => {
    try {
      const endpoint = type === 'followers'
        ? `/api/users/${userId}/followers?limit=20&offset=${(page - 1) * 20}`
        : `/api/users/${userId}/following?limit=20&offset=${(page - 1) * 20}`;

      const response = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await response.json();
      const newUsers = data[type] || [];

      if (page === 1) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }

      setHasMore(newUsers.length === 20);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    if (!token) {
      toast.error('Please login to follow users');
      return;
    }

    try {
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFollowStates(prev => ({ ...prev, [targetUserId]: true }));
        toast.success('Followed successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to follow user');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFollowStates(prev => ({ ...prev, [targetUserId]: false }));
        toast.success('Unfollowed successfully');
      } else {
        toast.error('Failed to unfollow user');
      }
    } catch (error) {
      console.error('Unfollow error:', error);
      toast.error('Failed to unfollow user');
    }
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="p-8 bg-gray-800/50 border-gray-700 text-center">
        <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">
          {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {users.map(user => {
        const isFollowing = followStates[user.id] !== undefined
          ? followStates[user.id]
          : false;
        const isCurrentUser = currentUser?.id === user.id;

        return (
          <Card key={user.id} className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-center justify-between">
              <Link to={`/profile/${user.username}`} className="flex items-center gap-4 flex-1">
                <Avatar className="w-12 h-12 border-2 border-gray-700">
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                  <AvatarFallback className="bg-red-600 text-white">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="text-white font-medium">{user.username}</p>
                  {user.bio && (
                    <p className="text-sm text-gray-400 line-clamp-1">{user.bio}</p>
                  )}
                </div>
              </Link>

              {!isCurrentUser && token && (
                <Button
                  size="sm"
                  variant={isFollowing ? 'outline' : 'default'}
                  onClick={() => isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        );
      })}

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
