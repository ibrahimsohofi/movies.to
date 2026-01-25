import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '@/services/tmdb';
import { useWatchlistStore, useUserRatingsStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import OptimizedImage from '@/components/common/OptimizedImage';
import { QuickRating } from './StarRating';
import { toast } from 'sonner';

export default function MovieCard({ movie }) {
  const { t } = useTranslation();
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore();
  const { getRating } = useUserRatingsStore();
  const isInWatchlist = watchlist.some((m) => m.id === movie.id);
  const userRating = getRating(movie.id);
  const [isLoading, setIsLoading] = useState(false);

  const handleWatchlistToggle = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate async operation (for visual feedback)
    await new Promise(resolve => setTimeout(resolve, 300));

    if (isInWatchlist) {
      removeFromWatchlist(movie.id);
      toast.success(t('movie.removedFromWatchlist'));
    } else {
      addToWatchlist(movie);
      toast.success(t('movie.addedToWatchlist'));
    }

    setIsLoading(false);
  };

  const posterUrl = getImageUrl(movie.poster_path, 'w500');
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  return (
    <Card
      className="group relative overflow-hidden hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 hover:-translate-y-3 hover:ring-2 hover:ring-red-500/50 animate-slide-in-up"
      role="article"
      aria-label={`${movie.title} (${year})`}
    >
      <Link
        to={`/movie/${movie.id}`}
        aria-label={`View details for ${movie.title}, rated ${rating} stars`}
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          {/* Optimized Image Component */}
          <OptimizedImage
            src={posterUrl}
            alt={`${movie.title} movie poster`}
            fallbackTitle={movie.title}
            className="group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700"
          />

          {/* Overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <p className="text-sm text-white/90 line-clamp-3 leading-relaxed">
                {movie.overview || t('movie.noDescription')}
              </p>
              {movie.vote_count > 0 && (
                <p className="text-xs text-white/70" aria-label={`${movie.vote_count.toLocaleString()} user ratings`}>
                  {movie.vote_count.toLocaleString()} {t('movie.votes')}
                </p>
              )}
            </div>
          </div>

          {/* Rating Badge */}
          {movie.vote_average > 0 && (
            <div
              className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-lg group-hover:scale-110 transition-transform duration-300"
              aria-label={`Rating: ${rating} out of 10`}
              role="img"
            >
              <Star className="h-3 w-3 fill-white text-white" aria-hidden="true" />
              <span className="text-xs font-bold text-white">{rating}</span>
            </div>
          )}

          {/* High Rating Indicator */}
          {movie.vote_average >= 8 && (
            <div
              className="absolute top-2 left-2 -ml-10 group-hover:ml-0 transition-all duration-500"
              aria-label="Highly rated movie"
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-r-lg shadow-lg">
                {t('movie.hot')}
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
              aria-label={isInWatchlist ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
              aria-pressed={isInWatchlist}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" aria-label="Loading" />
              ) : isInWatchlist ? (
                <BookmarkCheck className="h-4 w-4 text-white" aria-hidden="true" />
              ) : (
                <Bookmark className="h-4 w-4 text-white" aria-hidden="true" />
              )}
            </Button>
          </div>

          {/* Quick Rating Button - Always visible if rated, shows on hover otherwise */}
          <div className={`absolute bottom-2 right-2 transition-all duration-300 ${
            userRating ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <QuickRating movie={movie} />
          </div>
        </div>

        <CardContent className="p-4 bg-gradient-to-b from-transparent to-muted/30">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1.5 group-hover:text-red-600 transition-colors duration-300 leading-snug">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between">
            <time className="text-xs text-muted-foreground font-medium" dateTime={movie.release_date}>
              {year}
            </time>
            {movie.original_language && (
              <span
                className="text-xs text-muted-foreground/70 uppercase font-semibold"
                aria-label={`Language: ${movie.original_language}`}
              >
                {movie.original_language}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
