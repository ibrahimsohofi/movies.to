import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tmdbAPI } from '@/services/tmdb';
import MovieCard from './MovieCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function BecauseYouRated({ movie, rating }) {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await tmdbAPI.getRecommendations(movie.id, 1);
        setRecommendations(response.results?.slice(0, 6) || []);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [movie.id]);

  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold">
                {t('recommendations.becauseYouRated', 'Because you rated')}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  "{movie.title}"
                </span>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-3 w-3',
                        i < rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-transparent text-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] bg-muted/50 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendations.map((rec) => (
              <MovieCard key={rec.id} movie={rec} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
