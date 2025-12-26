import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tmdbAPI } from '@/services/tmdb';
import MovieGrid from '@/components/movie/MovieGrid';
import { Button } from '@/components/ui/button';
import ErrorState from '@/components/common/ErrorState';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import Pagination from '@/components/common/Pagination';

export default function Browse() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [infinite, setInfinite] = useState(true);
  const loadMoreRef = useRef(null);

  const sortBy = searchParams.get('sort') || 'popular';

  const fetchMovies = async (reset = true) => {
    try {
      setLoading(true);
      setError(null);
      let response;

      switch (sortBy) {
        case 'trending':
          response = await tmdbAPI.getTrending('week', page);
          break;
        case 'top_rated':
          response = await tmdbAPI.getTopRated(page);
          break;
        case 'upcoming':
          response = await tmdbAPI.getUpcoming(page);
          break;
        case 'now_playing':
          response = await tmdbAPI.getNowPlaying(page);
          break;
        default:
          response = await tmdbAPI.getPopular(page);
      }

      const current = response.results || [];
      const nextMovies = reset ? current : [...movies, ...current];
      setMovies(nextMovies);
      setTotalPages(Math.min(response.total_pages || 1, 500));
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset when sort changes
    setPage(1);
    fetchMovies(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  useEffect(() => {
    // Fetch when page changes (for pagination or infinite scroll)
    fetchMovies(page === 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!infinite) return;
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && page < totalPages) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [infinite, loading, page, totalPages]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSortTitle = () => {
    switch (sortBy) {
      case 'trending':
        return t('browse.trendingMovies');
      case 'top_rated':
        return t('browse.topRatedMovies');
      case 'upcoming':
        return t('browse.upcomingMovies');
      case 'now_playing':
        return t('home.nowPlaying');
      default:
        return t('browse.popularMovies');
    }
  };

  const handleRetry = () => {
    fetchMovies(page === 1);
  };

  if (error && !loading) {
    return (
      <ErrorState
        error={error}
        onRetry={handleRetry}
        showDetails={true}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{getSortTitle()}</h1>
          <Button variant="outline" onClick={() => setInfinite((v) => !v)}>
            {infinite ? t('browse.switchToPagination') : t('browse.switchToInfiniteScroll')}
          </Button>
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortBy === 'popular' ? 'default' : 'outline'}
            onClick={() => {
              setSearchParams({ sort: 'popular' });
              setPage(1);
            }}
          >
            {t('browse.popular')}
          </Button>
          <Button
            variant={sortBy === 'trending' ? 'default' : 'outline'}
            onClick={() => {
              setSearchParams({ sort: 'trending' });
              setPage(1);
            }}
          >
            {t('browse.trending')}
          </Button>
          <Button
            variant={sortBy === 'top_rated' ? 'default' : 'outline'}
            onClick={() => {
              setSearchParams({ sort: 'top_rated' });
              setPage(1);
            }}
          >
            {t('browse.topRated')}
          </Button>
          <Button
            variant={sortBy === 'now_playing' ? 'default' : 'outline'}
            onClick={() => {
              setSearchParams({ sort: 'now_playing' });
              setPage(1);
            }}
          >
            {t('browse.nowPlaying')}
          </Button>
          <Button
            variant={sortBy === 'upcoming' ? 'default' : 'outline'}
            onClick={() => {
              setSearchParams({ sort: 'upcoming' });
              setPage(1);
            }}
          >
            {t('browse.upcoming')}
          </Button>
        </div>
      </div>

      {/* Movies Grid */}
      <MovieGrid movies={movies} loading={loading && page === 1} />

      {/* Infinite Scroll Loading Indicator */}
      {infinite && loading && page > 1 && (
        <LoadingIndicator text={t('browse.loadingMoreMovies')} size="md" />
      )}

      {/* Infinite Scroll Sentinel */}
      {infinite && !loading && page < totalPages && (
        <div ref={loadMoreRef} className="h-10" />
      )}

      {/* Pagination */}
      {!infinite && !loading && totalPages > 1 && (
        <div className="mt-12 animate-slide-in-up">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
