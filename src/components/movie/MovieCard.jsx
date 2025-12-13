import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { getImageUrl } from '@/services/tmdb';
import { useWatchlistStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import OptimizedImage from '@/components/common/OptimizedImage';
import { toast } from 'sonner';

export default function MovieCard({ movie }) {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore();
  const isInWatchlist = watchlist.some((m) => m.id === movie.id);
  const [isLoading, setIsLoading] = useState(false);

  const handleWatchlistToggle = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate async operation (for visual feedback)
    await new Promise(resolve => setTimeout(resolve, 300));

    if (isInWatchlist) {
      removeFromWatchlist(movie.id);
      toast.success('Removed from watchlist');
    } else {
      addToWatchlist(movie);
      toast.success('Added to watchlist');
    }

    setIsLoading(false);
  };

  const posterUrl = getImageUrl(movie.poster_path, 'w500');
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  return (
    <Card className="group relative overflow-hidden hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 hover:-translate-y-3 hover:ring-2 hover:ring-red-500/50 animate-slide-in-up">
      <Link to={`/movie/${movie.id}`}>
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          {/* Optimized Image Component */}
          <OptimizedImage
            src={posterUrl}
            alt={movie.title}
            fallbackTitle={movie.title}
            className="group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <p className="text-sm text-white/90 line-clamp-3 leading-relaxed">
                {movie.overview || 'No description available.'}
              </p>
              {movie.vote_count > 0 && (
                <p className="text-xs text-white/70">
                  {movie.vote_count.toLocaleString()} votes
                </p>
              )}
            </div>
          </div>

          {/* Rating Badge */}
          {movie.vote_average > 0 && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Star className="h-3 w-3 fill-white text-white" />
              <span className="text-xs font-bold text-white">{rating}</span>
            </div>
          )}

          {/* High Rating Indicator */}
          {movie.vote_average >= 8 && (
            <div className="absolute top-2 left-2 -ml-10 group-hover:ml-0 transition-all duration-500">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-r-lg shadow-lg">
                HOT
              </div>
            </div>
          )}

          {/* Watchlist Button */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
            <Button
              size="icon"
              variant="secondary"
              className={`h-9 w-9 rounded-full backdrop-blur-md shadow-lg transition-all duration-300 ${
                isInWatchlist
                  ? 'bg-red-600 hover:bg-red-700 animate-glow'
                  : 'bg-black/70 hover:bg-black/90'
              }`}
              onClick={handleWatchlistToggle}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              ) : isInWatchlist ? (
                <BookmarkCheck className="h-4 w-4 text-white" />
              ) : (
                <Bookmark className="h-4 w-4 text-white" />
              )}
            </Button>
          </div>
        </div>

        <CardContent className="p-4 bg-gradient-to-b from-transparent to-muted/30">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1.5 group-hover:text-red-600 transition-colors duration-300 leading-snug">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">{year}</p>
            {movie.original_language && (
              <span className="text-xs text-muted-foreground/70 uppercase font-semibold">
                {movie.original_language}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
