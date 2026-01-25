import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useStore';
import { toast } from 'sonner';
import axios from 'axios';

export default function FollowButton({ userId, isFollowing: initialFollowing, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuthStore();

  const handleFollowToggle = async () => {
    if (!token || !user) {
      toast.error('Please log in to follow users');
      return;
    }

    if (user.id === userId) {
      toast.error("You can't follow yourself");
      return;
    }

    try {
      setLoading(true);

      if (isFollowing) {
        // Unfollow
        await axios.delete(`/api/users/${userId}/follow`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await axios.post(
          `/api/users/${userId}/follow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFollowing(true);
        toast.success('Following successfully');
      }

      // Callback to parent component
      if (onFollowChange) {
        onFollowChange(!isFollowing);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      toast.error(error.response?.data?.error || 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  if (!token || user?.id === userId) {
    return null;
  }

  return (
    <Button
      onClick={handleFollowToggle}
      disabled={loading}
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      className={isFollowing ? 'gap-2' : 'gap-2'}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </>
      ) : (
        <>
          {isFollowing ? (
            <>
              <UserMinus className="h-4 w-4" />
              Unfollow
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Follow
            </>
          )}
        </>
      )}
    </Button>
  );
}
