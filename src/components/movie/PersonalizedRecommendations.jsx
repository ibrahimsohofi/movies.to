import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Heart, ChevronRight, Star } from 'lucide-react';
import { tmdbAPI } from '@/services/tmdb';
import { useUserRatingsStore, useWatchlistStore, useRecentlyViewedStore } from '@/store/useStore';
import MovieGrid from './MovieGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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

export default function PersonalizedRecommendations() {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forYou');

  // Get store data using selectors to prevent unnecessary re-renders
  const ratings = useUserRatingsStore((state) => state.ratings);
  const watchlist = useWatchlistStore((state) => state.watchlist);
  const recentlyViewed = useRecentlyViewedStore((state) => state.recentlyViewed);

  // Memoize derived values to prevent infinite loops
  const allRatings = useMemo(() => {
    return Object.values(ratings).sort(
      (a, b) => new Date(b.ratedAt) - new Date(a.ratedAt)
    );
  }, [ratings]);

  const favoriteGenres = useMemo(() => {
    const genreScores = {};
    Object.values(ratings).forEach(({ rating, movie }) => {
      const genreIds = movie.genre_ids || [];
      genreIds.forEach((genreId) => {
        if (!genreScores[genreId]) {
          genreScores[genreId] = { total: 0, count: 0 };
        }
        genreScores[genreId].total += rating;
        genreScores[genreId].count += 1;
      });
    });

    return Object.entries(genreScores)
      .map(([genreId, { total, count }]) => ({
        genreId: parseInt(genreId),
        averageRating: total / count,
        count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);
  }, [ratings]);

  const highlyRated = useMemo(() => {
    return Object.values(ratings)
      .filter((r) => r.rating >= 4)
      .map((r) => r.movie);
  }, [ratings]);

  // Get all movie IDs to exclude from recommendations
  const excludeIds = useMemo(() => {
    const ids = new Set();
    allRatings.forEach(r => ids.add(r.movie.id));
    watchlist.forEach(m => ids.add(m.id));
    recentlyViewed.forEach(m => ids.add(m.id));
    return ids;
  }, [allRatings, watchlist, recentlyViewed]);

  // Create a stable key for the effect dependency
  const highlyRatedIds = useMemo(() => highlyRated.map(m => m.id).join(','), [highlyRated]);
  const watchlistIds = useMemo(() => watchlist.map(m => m.id).join(','), [watchlist]);
  const favoriteGenreIds = useMemo(() => favoriteGenres.map(g => g.genreId).join(','), [favoriteGenres]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (highlyRated.length === 0 && watchlist.length === 0) {
        // No user data, show trending instead
        try {
          const trending = await tmdbAPI.getTrending('week', 1);
          setRecommendations(trending.results?.slice(0, 12) || []);
        } catch (err) {
          console.error('Error fetching trending:', err);
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allRecs = [];

        // Get recommendations from highly rated movies
        const sourceMovies = highlyRated.length > 0
          ? highlyRated.slice(0, 3)
          : watchlist.slice(0, 3);

        const recPromises = sourceMovies.map(movie =>
          tmdbAPI.getRecommendations(movie.id, 1).catch(() => ({ results: [] }))
        );

        const recResults = await Promise.all(recPromises);
        recResults.forEach(res => {
          if (res?.results) {
            allRecs.push(...res.results);
          }
        });

        // Also get movies from favorite genres
        if (favoriteGenres.length > 0) {
          const topGenreIds = favoriteGenres.slice(0, 2).map(g => g.genreId);
          const genreMovies = await tmdbAPI.getMoviesByMultipleGenres(topGenreIds, 1, 'vote_average.desc');
          if (genreMovies?.results) {
            allRecs.push(...genreMovies.results);
          }
        }

        // Deduplicate and filter out already seen/rated movies
        const uniqueRecs = [];
        const seenIds = new Set();

        for (const movie of allRecs) {
          if (!seenIds.has(movie.id) && !excludeIds.has(movie.id)) {
            seenIds.add(movie.id);
            uniqueRecs.push(movie);
          }
        }

        // Sort by vote average and take top results
        uniqueRecs.sort((a, b) => b.vote_average - a.vote_average);
        setRecommendations(uniqueRecs.slice(0, 12));
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [highlyRatedIds, watchlistIds, favoriteGenreIds]); // Use stable string keys

  const hasUserData = allRatings.length > 0 || watchlist.length > 0;

  // Stats for the header
  const stats = useMemo(() => {
    const totalRatings = allRatings.length;
    const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = totalRatings > 0 ? sum / totalRatings : 0;
    return {
      totalRatings,
      averageRating: averageRating.toFixed(1),
      topGenres: favoriteGenres.slice(0, 3).map(g => GENRE_NAMES[g.genreId] || 'Unknown'),
    };
  }, [allRatings, favoriteGenres]);

  if (!hasUserData && !loading && recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg shadow-purple-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">
                {hasUserData ? t('personalizedRecs.recommendedForYou') : t('personalizedRecs.discoverMovies')}
              </h2>
              {hasUserData && stats.topGenres.length > 0 && (
                <p className="text-muted-foreground text-sm mt-1">
                  {t('personalizedRecs.basedOn', { genres: stats.topGenres.join(', ') })}
                </p>
              )}
            </div>
          </div>

          {/* User Stats */}
          {hasUserData && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium">{t('personalizedRecs.ratedCount', { count: stats.totalRatings })}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                <Heart className="h-4 w-4 text-red-400 fill-red-400" />
                <span className="text-sm font-medium">{t('personalizedRecs.savedCount', { count: watchlist.length })}</span>
              </div>
            </div>
          )}
        </div>

        {/* Top Genres Tags */}
        {hasUserData && stats.topGenres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {stats.topGenres.map((genre) => (
              <Badge
                key={genre}
                variant="secondary"
                className="bg-purple-500/10 text-purple-400 border-purple-500/20"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {/* Recommendations Grid */}
        <MovieGrid
          movies={recommendations}
          loading={loading}
          showRating
        />

        {/* Empty State */}
        {!loading && recommendations.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-border/50">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('personalizedRecs.startRating')}</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {t('personalizedRecs.startRatingDesc')}
            </p>
            <Link to="/browse">
              <Button>
                {t('common.browseMovies', 'Browse Movies')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* View More */}
        {recommendations.length > 0 && (
          <div className="text-center mt-8">
            <Link to="/recommendations">
              <Button variant="outline" size="lg">
                {t('personalizedRecs.viewAllRecommendations')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
