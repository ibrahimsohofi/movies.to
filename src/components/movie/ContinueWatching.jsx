import { Link } from 'react-router-dom';
import { Play, Clock, X, History, Tv, Film, ChevronRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWatchHistoryStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export default function ContinueWatching() {
  const { t } = useTranslation();
  const { watchHistory, removeFromWatchHistory, clearWatchHistory } = useWatchHistoryStore();

  // Get items that are in progress (less than 90% watched)
  const continueWatchingItems = watchHistory
    .filter(item => item.progress < 90)
    .slice(0, 8);

  // Get recently finished items
  const recentlyFinished = watchHistory
    .filter(item => item.progress >= 90)
    .slice(0, 4);

  if (watchHistory.length === 0) {
    return null;
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Continue Watching Section */}
      {continueWatchingItems.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg shadow-lg shadow-emerald-500/20">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('home.continueWatching', 'Continue Watching')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('home.pickUpWhereLeft', 'Pick up where you left off')}
                </p>
              </div>
            </div>
            <Link to="/history">
              <Button variant="ghost" className="gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600">
                {t('home.viewAll', 'View All')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {continueWatchingItems.map((item) => (
              <div
                key={item.contentId}
                className="group relative bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3]">
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      {item.type === 'tv' ? (
                        <Tv className="h-12 w-12 text-gray-600" />
                      ) : (
                        <Film className="h-12 w-12 text-gray-600" />
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Link
                        to={getWatchLink(item)}
                        className="p-4 bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                      >
                        <Play className="h-6 w-6 text-white fill-white" />
                      </Link>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromWatchHistory(item.contentId);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 rounded-full transition-colors"
                      title="Remove from history"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  {/* Content Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      item.type === 'tv'
                        ? 'bg-purple-600/80 text-white'
                        : 'bg-blue-600/80 text-white'
                    }`}>
                      {item.type === 'tv' ? 'TV' : 'Movie'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <Link to={getDetailsLink(item)}>
                    <h3 className="font-semibold text-sm line-clamp-1 hover:text-emerald-500 transition-colors">
                      {item.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(item.lastWatchedAt)}</span>
                  </div>
                  {item.type === 'tv' && item.season && item.episode && (
                    <p className="text-xs text-muted-foreground mt-1">
                      S{item.season} E{item.episode}
                    </p>
                  )}
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    {Math.round(item.progress)}% watched
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Watched (Completed) */}
      {recentlyFinished.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg shadow-lg shadow-violet-500/20">
                <History className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {t('home.recentlyWatched', 'Recently Watched')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('home.yourWatchHistory', 'Your watch history')}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearWatchHistory}
              className="gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.clearHistory', 'Clear History')}</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {recentlyFinished.map((item) => (
              <div
                key={item.contentId}
                className="group relative bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <Link to={getDetailsLink(item)}>
                  <div className="relative aspect-video">
                    {item.backdrop_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : item.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        {item.type === 'tv' ? (
                          <Tv className="h-8 w-8 text-gray-600" />
                        ) : (
                          <Film className="h-8 w-8 text-gray-600" />
                        )}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                    {/* Watched Badge */}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-600/80 text-white">
                        Watched
                      </span>
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-white text-sm line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-300">
                        <span>{item.type === 'tv' ? 'TV Show' : 'Movie'}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(item.lastWatchedAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
