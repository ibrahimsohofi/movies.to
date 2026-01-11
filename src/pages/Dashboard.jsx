import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Star, User, Calendar, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useWatchlistStore } from '@/store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/services/tmdb';
import ProfileSettings from '@/components/common/ProfileSettings';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { watchlist } = useWatchlistStore();
  const [stats, setStats] = useState({
    totalWatchlist: 0,
    recentlyAdded: [],
    topGenres: []
  });

  useEffect(() => {
    calculateStats();
  }, [watchlist]);

  const calculateStats = () => {
    const totalWatchlist = watchlist.length;
    const recentlyAdded = watchlist.slice(0, 6);

    // Calculate top genres
    const genreCounts = {};
    watchlist.forEach(movie => {
      if (movie.genre_ids) {
        movie.genre_ids.forEach(genreId => {
          genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
        });
      }
    });

    const genreNames = {
      28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
      80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
      14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
      9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
      10752: 'War', 37: 'Western'
    };

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genreId, count]) => ({
        name: genreNames[genreId] || 'Unknown',
        count
      }));

    setStats({
      totalWatchlist,
      recentlyAdded,
      topGenres
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{t('dashboard.dashboardAccess')}</CardTitle>
            <CardDescription>{t('dashboard.loginToViewDashboard')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full">{t('dashboard.login')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.welcomeBack', { username: user?.username || t('common.movieLover', 'Movie Lover') })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.watchlist')}</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWatchlist}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.watchlistMoviesSaved', { count: stats.totalWatchlist })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.memberSince')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.accountCreated')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.reviews')}</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.comingSoon')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recently Added to Watchlist */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('dashboard.recentlyAddedToWatchlist')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.mostRecentAdditions')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentlyAdded.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('dashboard.noMoviesInWatchlist')}</p>
                  <Link to="/browse">
                    <Button variant="link">{t('dashboard.browseMovies')}</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {stats.recentlyAdded.map((movie) => (
                    <Link
                      key={movie.id}
                      to={`/movie/${movie.id}`}
                      className="group"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                        {movie.poster_path ? (
                          <img
                            src={getImageUrl(movie.poster_path, 'w342')}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-medium mt-2 line-clamp-1">
                        {movie.title}
                      </h3>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorite Genres */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.favoriteGenres')}</CardTitle>
              <CardDescription>
                {t('dashboard.basedOnWatchlist')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topGenres.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('profile.addMoviesToSeeGenres')}
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.topGenres.map((genre, index) => (
                    <div key={genre.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="text-sm font-medium">{genre.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {genre.count} {genre.count === 1 ? 'movie' : 'movies'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Settings */}
        <div className="mt-6">
          <ProfileSettings />
        </div>
      </div>
    </div>
  );
}
