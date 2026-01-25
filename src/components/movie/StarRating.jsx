import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRatingsStore } from '@/store/useStore';
import { toast } from 'sonner';

export default function StarRating({
  movie,
  size = 'default',
  showLabel = true,
  onRate,
  className
}) {
  const { getRating, rateMovie, removeRating } = useUserRatingsStore();
  const currentRating = getRating(movie.id);
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: { star: 'h-4 w-4', gap: 'gap-0.5' },
    default: { star: 'h-5 w-5', gap: 'gap-1' },
    lg: { star: 'h-6 w-6', gap: 'gap-1' },
    xl: { star: 'h-8 w-8', gap: 'gap-1.5' },
  };

  const { star: starSize, gap } = sizes[size] || sizes.default;

  const handleRate = (rating) => {
    if (rating === currentRating) {
      // Click same star to remove rating
      removeRating(movie.id);
      toast.success('Rating removed');
    } else {
      rateMovie(movie, rating);
      toast.success(`Rated ${movie.title} ${rating} star${rating > 1 ? 's' : ''}`);
    }
    onRate?.(rating);
  };

  const displayRating = hoverRating || currentRating || 0;

  return (
    <div className={cn('flex flex-col', className)}>
      <div
        className={cn('flex items-center', gap)}
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                starSize,
                'transition-colors duration-150',
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-muted-foreground/40 hover:text-yellow-400/60'
              )}
            />
          </button>
        ))}
      </div>
      {showLabel && currentRating && (
        <span className="text-xs text-muted-foreground mt-1">
          Your rating: {currentRating}/5
        </span>
      )}
    </div>
  );
}

// Compact version for movie cards
export function QuickRating({ movie, className }) {
  const { getRating, rateMovie } = useUserRatingsStore();
  const currentRating = getRating(movie.id);
  const [isOpen, setIsOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleRate = (rating, e) => {
    e.stopPropagation();
    e.preventDefault();
    rateMovie(movie, rating);
    toast.success(`Rated ${rating} stars`);
    setIsOpen(false);
  };

  const displayRating = hoverRating || currentRating || 0;

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        setIsOpen(false);
        setHoverRating(0);
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all',
          currentRating
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            : 'bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground border border-border/50'
        )}
      >
        <Star className={cn('h-3 w-3', currentRating && 'fill-yellow-400')} />
        {currentRating ? currentRating : 'Rate'}
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={(e) => handleRate(star, e)}
                onMouseEnter={() => setHoverRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-5 w-5 transition-colors',
                    star <= displayRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-transparent text-muted-foreground/40'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
