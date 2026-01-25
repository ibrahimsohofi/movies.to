import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useStore';
import FollowButton from './FollowButton';
import axios from 'axios';

export default function FollowingList({ userId }) {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchFollowing();
  }, [userId]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`/api/users/${userId}/following`, { headers });
      setFollowing(response.data.following || []);
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!following.length) {
    return (
      <div className="text-center py-12">
        <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Not following anyone yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <UserCheck className="h-5 w-5" />
        Following ({following.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {following.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <Link
                to={`/profile/${user.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                  <AvatarFallback>
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="font-semibold">{user.username}</h3>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {user.bio}
                    </p>
                  )}
                  {user.followerCount !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {user.followerCount} followers
                    </p>
                  )}
                </div>
              </Link>

              <FollowButton
                userId={user.id}
                isFollowing={true}
                onFollowChange={() => fetchFollowing()}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
