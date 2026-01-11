import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2, BarChart3, TrendingUp, Film } from 'lucide-react';
import { useUserRatingsStore } from '@/store/useStore';
import { getImageUrl } from '@/services/tmdb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import StarRating from '@/components/movie/StarRating';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const GENRE_NAMES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

export default function MyRatings() {
  const { getAllRatings, getStats, getFavoriteGenres, removeRating, clearAllRatings } = useUserRatingsStore();

  const allRatings = getAllRatings();
  const stats = getStats();
  const favoriteGenres = getFavoriteGenres();

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all ratings? This cannot be undone.')) {
      clearAllRatings();
      toast.success('All ratings cleared');
    }
  };

  const handleRemoveRating = (movieId, title) => {
    removeRating(movieId);
    toast.success(`Removed rating for ${title}`);
  };

  // Rating distribution for chart
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(stats.distribution || {}), 1);
  }, [stats.distribution]);

  if (allRatings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="p-4 bg-muted/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Star className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">No Ratings Yet</h1>
          <p className="text-muted-foreground mb-6">
            Start rating movies to keep track of what you've watched and get personalized recommendations.
          </p>
          <Link to="/browse">
            <Button size="lg">
              <Film className="h-4 w-4 mr-2" />
              Browse Movies
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Ratings</h1>
          <p className="text-muted-foreground">
            You've rated {stats.totalRatings} movie{stats.totalRatings !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={handleClearAll} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Average Rating */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Average Rating</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">/5</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Ratings */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Ratings</span>
            </div>
            <div className="text-4xl font-bold">{stats.totalRatings}</div>
          </CardContent>
        </Card>

        {/* Favorite Genre */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Top Genre</span>
            </div>
            <div className="text-xl font-bold">
              {favoriteGenres.length > 0 ? GENRE_NAMES[favoriteGenres[0].genreId] || 'Unknown' : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Rating Distribution
          </h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <Progress
                    value={(stats.distribution?.[rating] || 0) / maxCount * 100}
                    className="h-2"
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8 text-right">
                  {stats.distribution?.[rating] || 0}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorite Genres */}
      {favoriteGenres.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Your Favorite Genres</h3>
          <div className="flex flex-wrap gap-2">
            {favoriteGenres.slice(0, 5).map((genre) => (
              <Badge
                key={genre.genreId}
                variant="secondary"
                className="px-3 py-1.5"
              >
                {GENRE_NAMES[genre.genreId] || 'Unknown'}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({genre.count} rated, avg {genre.averageRating.toFixed(1)})
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Rated Movies Grid */}
      <h3 className="font-semibold mb-4">All Rated Movies</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {allRatings.map(({ movie, rating, ratedAt }) => (
          <Card key={movie.id} className="group overflow-hidden hover:shadow-lg transition-all">
            <Link to={`/movie/${movie.id}`}>
              <div className="relative aspect-[2/3]">
                <img
                  src={getImageUrl(movie.poster_path, 'w342') || '/movie-poster-fallback.svg'}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3 fill-white text-white" />
                  <span className="text-xs font-bold text-white">{rating}</span>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveRating(movie.id, movie.title);
                  }}
                  className="absolute top-2 left-2 p-1.5 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="h-3 w-3 text-white" />
                </button>
              </div>
            </Link>
            <CardContent className="p-3">
              <h4 className="font-medium text-sm line-clamp-1 mb-1">{movie.title}</h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : '-'}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-3 w-3',
                        star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
