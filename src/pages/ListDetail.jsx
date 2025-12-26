import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Heart, Share2, Edit2, Trash2, Lock, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useStore';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import EmptyState from '@/components/common/EmptyState';
import MovieCard from '@/components/movie/MovieCard';
import MetaTags from '@/components/common/MetaTags';

export default function ListDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [list, setList] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchListDetail();
  }, [id]);

  const fetchListDetail = async () => {
    try {
      const response = await api.get(`/lists/${id}`);
      setList(response.data.list);
      setMovies(response.data.movies || []);
      setIsLiked(response.data.isLiked || false);
    } catch (error) {
      console.error('Error fetching list:', error);
      toast.error(t('listDetail.failedToLoad'));
      navigate('/lists');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await api.delete(`/lists/${id}/like`);
        setIsLiked(false);
        setList({ ...list, like_count: list.like_count - 1 });
        toast.success(t('listDetail.removedFromFavorites'));
      } else {
        await api.post(`/lists/${id}/like`);
        setIsLiked(true);
        setList({ ...list, like_count: (list.like_count || 0) + 1 });
        toast.success(t('listDetail.addedToFavorites'));
      }
    } catch (error) {
      console.error('Error liking list:', error);
      toast.error(t('listDetail.failedToLoad'));
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: list.title,
          text: list.description || `Check out this movie list: ${list.title}`,
          url: url,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast.success(t('common.copied'));
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('common.copied'));
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!confirm('Remove this movie from the list?')) return;

    try {
      await api.delete(`/lists/${id}/movies/${movieId}`);
      setMovies(movies.filter(m => m.id !== movieId));
      toast.success(t('toasts.movieRemovedFromList'));
    } catch (error) {
      console.error('Error removing movie:', error);
      toast.error(t('toasts.movieRemoveFailed'));
    }
  };

  const handleDeleteList = async () => {
    if (!confirm('Are you sure you want to delete this entire list?')) return;

    try {
      await api.delete(`/lists/${id}`);
      toast.success(t('toasts.listDeleted'));
      navigate('/lists');
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error(t('listDetail.failedToLoad'));
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!list) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="List not found"
          description="This list doesn't exist or you don't have permission to view it"
          action={
            <Link to="/lists">
              <Button>Back to Lists</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isOwner = user && list.user_id === user.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <MetaTags
        title={`${list.title} - Movies.to`}
        description={list.description || `A movie list by ${list.username}`}
      />

      {/* Back Button */}
      <Link to="/lists">
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Lists
        </Button>
      </Link>

      {/* List Header */}
      <Card className="p-8 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl font-bold">{list.title}</h1>
              <Badge variant="outline" className="gap-1">
                {list.is_public ? (
                  <>
                    <Globe className="h-3 w-3" />
                    {t('listDetail.publicList')}
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    {t('listDetail.privateList')}
                  </>
                )}
              </Badge>
            </div>
            {list.description && (
              <p className="text-lg text-muted-foreground mb-4">
                {list.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{t('listDetail.createdBy')} {list.username || 'Anonymous'}</span>
              <span>•</span>
              <span>{movies.length} {t('listDetail.movies')}</span>
              <span>•</span>
              <span>{list.like_count || 0} {t('discoverLists.likes')}</span>
              <span>•</span>
              <span>Created {new Date(list.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant={isLiked ? 'default' : 'outline'}
            onClick={handleLike}
            className="gap-2"
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? t('listDetail.unlike') : t('listDetail.like')}
          </Button>
          <Button variant="outline" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            {t('listDetail.share')}
          </Button>
          {isOwner && (
            <>
              <Button variant="outline" className="gap-2">
                <Edit2 className="h-4 w-4" />
                {t('common.edit')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteList} className="gap-2">
                <Trash2 className="h-4 w-4" />
                {t('listDetail.delete')}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Movies Grid */}
      {movies.length === 0 ? (
        <EmptyState
          title="No movies in this list yet"
          description={isOwner ? "Start adding movies to your list" : "This list is empty"}
          action={
            isOwner && (
              <Link to="/browse">
                <Button className="gap-2">
                  <Plus className="h-5 w-5" />
                  Browse Movies
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <div key={movie.id} className="relative group">
              <MovieCard movie={movie} />
              {isOwner && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteMovie(movie.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
