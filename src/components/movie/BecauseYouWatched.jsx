import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { tmdbAPI, getImageUrl } from '@/services/tmdb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function BecauseYouWatched({ movieId, movieTitle }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const data = await tmdbAPI.getSimilarMovies(movieId);
        setRecommendations(data.results.slice(0, 12));
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchRecommendations();
    }
  }, [movieId]);

  const scroll = (direction) => {
    const container = document.getElementById('recommendations-scroll');
    if (container) {
      // In RTL, reverse the scroll direction
      const scrollAmount = direction === 'left' ? (isRTL ? 300 : -300) : (isRTL ? -300 : 300);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setScrollPosition(container.scrollLeft + scrollAmount);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-pink-500" />
          <h2 className="text-2xl font-bold">{t('movieDetail.becauseYouWatched')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-700 rounded-lg aspect-[2/3]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-pink-500" />
          <h2 className="text-2xl font-bold">
            {t('movieDetail.becauseYouWatched')}{' '}
            <span className="text-pink-500">{movieTitle}</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={scrollPosition <= 0}
            className="rounded-full"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="rounded-full"
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div
        id="recommendations-scroll"
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        onScroll={(e) => setScrollPosition(e.target.scrollLeft)}
      >
        {recommendations.map((movie) => (
          <Link
            key={movie.id}
            to={`/movie/${movie.id}`}
            className="group flex-shrink-0 w-[160px] sm:w-[180px]"
          >
            <Card className="overflow-hidden border-none bg-gray-800/50 hover:bg-gray-800 transition-all duration-300 group-hover:scale-105">
              <div className="relative aspect-[2/3]">
                {movie.poster_path ? (
                  <img
                    src={getImageUrl(movie.poster_path, 'w342')}
                    alt={movie.title}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 text-sm text-center p-4">
                      {t('movie.noImage')}
                    </span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-yellow-500/90 text-black font-semibold">
                    <span className="mr-1">⭐</span>
                    {movie.vote_average?.toFixed(1) || t('movieDetail.na')}
                  </Badge>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-pink-500 transition-colors">
                  {movie.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {movie.release_date?.split('-')[0] || t('movieDetail.na')}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
