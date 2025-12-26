import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useStore';
import FollowButton from './FollowButton';
import axios from 'axios';

export default function FollowersList({ userId }) {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`/api/users/${userId}/followers`, { headers });
      setFollowers(response.data.followers || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
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

  if (!followers.length) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No followers yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Users className="h-5 w-5" />
        Followers ({followers.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {followers.map((follower) => (
          <Card key={follower.id} className="p-4">
            <div className="flex items-center justify-between">
              <Link
                to={`/profile/${follower.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={follower.avatar_url} alt={follower.username} />
                  <AvatarFallback>
                    {follower.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="font-semibold">{follower.username}</h3>
                  {follower.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {follower.bio}
                    </p>
                  )}
                  {follower.followerCount !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {follower.followerCount} followers
                    </p>
                  )}
                </div>
              </Link>

              <FollowButton
                userId={follower.id}
                isFollowing={follower.isFollowing || false}
                onFollowChange={() => fetchFollowers()}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
