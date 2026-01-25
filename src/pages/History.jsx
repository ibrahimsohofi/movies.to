import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Play,
  Clock,
  X,
  Trash2,
  Film,
  Tv,
  BarChart3,
  Calendar,
  Star,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWatchHistoryStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import MetaTags from '@/components/common/MetaTags';

export default function WatchHistory() {
  const { t } = useTranslation();
  const {
    watchHistory,
    removeFromWatchHistory,
    clearWatchHistory,
    getWatchStats
  } = useWatchHistoryStore();

  const [filter, setFilter] = useState('all'); // all, movies, tv, inProgress, completed
  const [showFilters, setShowFilters] = useState(false);

  const stats = getWatchStats();

  // Filter watch history
  const filteredHistory = watchHistory.filter(item => {
    switch (filter) {
      case 'movies':
        return item.type === 'movie';
      case 'tv':
        return item.type === 'tv';
      case 'inProgress':
        return item.progress < 90;
      case 'completed':
        return item.progress >= 90;
      default:
        return true;
    }
  });

  const getWatchLink = (item) => {
    if (item.type === 'tv' && item.season && item.episode) {
      return `/watch/${item.id}?type=tv&season=${item.season}&episode=${item.episode}`;
    }
    return `/watch/${item.id}?type=${item.type}`;
  };

  const getDetailsLink = (item) => {
    return item.type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  const formatWatchTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <>
      <MetaTags
        title="Watch History - Movies.to"
        description="View your watch history and continue watching where you left off"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-500/20">
                <History className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {t('history.title', 'Watch History')}
                </h1>
                <p className="text-muted-foreground">
                  {t('history.subtitle', 'Your viewing activity')}
                </p>
              </div>
            </div>

            {watchHistory.length > 0 && (
              <Button
                variant="outline"
                onClick={clearWatchHistory}
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4" />
                {t('history.clearAll', 'Clear All History')}
              </Button>
            )}
          </div>

          {/* Statistics Cards */}
          {watchHistory.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalWatched}</p>
                    <p className="text-sm text-muted-foreground">Total Watched</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Film className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.moviesWatched}</p>
                    <p className="text-sm text-muted-foreground">Movies</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Tv className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.tvWatched}</p>
                    <p className="text-sm text-muted-foreground">TV Shows</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatWatchTime(stats.totalWatchTime)}</p>
                    <p className="text-sm text-muted-foreground">Watch Time</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          {watchHistory.length > 0 && (
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="shrink-0"
              >
                All ({watchHistory.length})
              </Button>
              <Button
                variant={filter === 'inProgress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('inProgress')}
                className="shrink-0"
              >
                <Play className="h-4 w-4 mr-1" />
                In Progress ({watchHistory.filter(i => i.progress < 90).length})
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
                className="shrink-0"
              >
                Completed ({watchHistory.filter(i => i.progress >= 90).length})
              </Button>
              <Button
                variant={filter === 'movies' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('movies')}
                className="shrink-0"
              >
                <Film className="h-4 w-4 mr-1" />
                Movies
              </Button>
              <Button
                variant={filter === 'tv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('tv')}
                className="shrink-0"
              >
                <Tv className="h-4 w-4 mr-1" />
                TV Shows
              </Button>
            </div>
          )}

          {/* Empty State */}
          {watchHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <History className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No Watch History</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Start watching movies and TV shows to build your watch history.
                Your progress will be saved automatically.
              </p>
              <Link to="/browse">
                <Button className="gap-2">
                  <Play className="h-4 w-4" />
                  Browse Content
                </Button>
              </Link>
            </div>
          )}

          {/* Watch History List */}
          {filteredHistory.length > 0 && (
            <div className="space-y-4">
              {filteredHistory.map((item) => (
                <div
                  key={item.contentId}
                  className="group bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Poster */}
                    <div className="relative sm:w-32 md:w-40 shrink-0">
                      <Link to={getDetailsLink(item)}>
                        <div className="aspect-[2/3] sm:aspect-auto sm:h-full">
                          {item.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center min-h-[150px]">
                              {item.type === 'tv' ? (
                                <Tv className="h-12 w-12 text-gray-600" />
                              ) : (
                                <Film className="h-12 w-12 text-gray-600" />
                              )}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
                        <div
                          className={`h-full transition-all ${
                            item.progress >= 90
                              ? 'bg-green-500'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              item.type === 'tv'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {item.type === 'tv' ? 'TV Show' : 'Movie'}
                            </span>
                            {item.progress >= 90 && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Completed
                              </span>
                            )}
                          </div>

                          <Link to={getDetailsLink(item)}>
                            <h3 className="text-lg font-semibold hover:text-emerald-600 transition-colors line-clamp-1">
                              {item.title}
                            </h3>
                          </Link>

                          {item.type === 'tv' && item.season && item.episode && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Season {item.season}, Episode {item.episode}
                            </p>
                          )}

                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {item.overview}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTimeAgo(item.lastWatchedAt)}</span>
                            </div>
                            {item.vote_average > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span>{item.vote_average.toFixed(1)}</span>
                              </div>
                            )}
                            {item.duration > 0 && (
                              <div className="flex items-center gap-1">
                                <Film className="h-4 w-4" />
                                <span>{formatWatchTime(item.duration)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Play className="h-4 w-4" />
                              <span>{Math.round(item.progress)}% watched</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Link to={getWatchLink(item)}>
                            <Button size="sm" className="gap-2 w-full">
                              <Play className="h-4 w-4" />
                              {item.progress > 0 && item.progress < 90 ? 'Resume' : 'Watch'}
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromWatchHistory(item.contentId)}
                            className="gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results for Filter */}
          {watchHistory.length > 0 && filteredHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Results</h2>
              <p className="text-muted-foreground mb-4">
                No items match the selected filter.
              </p>
              <Button variant="outline" onClick={() => setFilter('all')}>
                Show All
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
