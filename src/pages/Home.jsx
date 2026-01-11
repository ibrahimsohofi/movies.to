import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Star, Calendar, Film, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tmdbAPI } from '@/services/tmdb';
import MovieGrid from '@/components/movie/MovieGrid';
import ApiKeyNotice from '@/components/common/ApiKeyNotice';
import ErrorState from '@/components/common/ErrorState';
import HeroSkeleton from '@/components/common/HeroSkeleton';
import HeroSlider from '@/components/movie/HeroSlider';
import RecentlyViewed from '@/components/movie/RecentlyViewed';
import ContinueWatching from '@/components/movie/ContinueWatching';
import PersonalizedRecommendations from '@/components/movie/PersonalizedRecommendations';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { t, i18n } = useTranslation();
  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        const [trendingRes, popularRes, topRatedRes] = await Promise.all([
          tmdbAPI.getTrending('week', 1),
          tmdbAPI.getPopular(1),
          tmdbAPI.getTopRated(1),
        ]);

        const trendingMovies = trendingRes.results || [];
        setTrending(trendingMovies);
        setPopular(popularRes.results || []);
        setTopRated(topRatedRes.results || []);

        // Set first trending movie as featured
        if (trendingMovies.length > 0) {
          setFeatured(trendingMovies[0]);
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [i18n.language]); // Refetch when language changes

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  // Check if API key is missing
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    return <ApiKeyNotice />;
  }

  // Show error if API request failed
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
    <div className="min-h-screen">
      {/* Hero Slider */}
      {loading && <HeroSkeleton />}
      {!loading && trending.length > 0 && <HeroSlider movies={trending} />}

      {/* Continue Watching - Watch History */}
      <ContinueWatching />

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Personalized Recommendations */}
      <PersonalizedRecommendations />

      {/* Movie Sections */}
      <div className="container mx-auto px-4 space-y-16 py-12">
        {/* Trending This Week */}
        <section className="animate-slide-in-up">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-600 to-pink-600 rounded-lg shadow-lg shadow-red-500/20">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  {t('home.trending')}
                </h2>
                <p className="text-sm text-muted-foreground">{t('home.mostPopularMovies')}</p>
              </div>
            </div>
            <Link to="/browse?sort=trending">
              <Button variant="ghost" className="gap-2 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600">
                {t('home.viewAll')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <MovieGrid movies={trending.slice(0, 12)} loading={loading} />
        </section>

        {/* Popular Movies */}
        <section className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-lg shadow-blue-500/20">
                <Film className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">{t('home.popular')}</h2>
                <p className="text-sm text-muted-foreground">{t('home.fanFavorites')}</p>
              </div>
            </div>
            <Link to="/browse?sort=popular">
              <Button variant="ghost" className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600">
                {t('home.viewAll')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
        </section>

        {/* Top Rated */}
        <section className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg shadow-yellow-500/20">
                <Star className="h-6 w-6 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {t('home.topRated')}
                </h2>
                <p className="text-sm text-muted-foreground">{t('home.highestRated')}</p>
              </div>
            </div>
            <Link to="/browse?sort=top_rated">
              <Button variant="ghost" className="gap-2 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:text-yellow-600">
                {t('home.viewAll')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <MovieGrid movies={topRated.slice(0, 12)} loading={loading} />
        </section>
      </div>
    </div>
  );
}
