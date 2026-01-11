import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Tv, Film, Server, Sparkles, Zap, MonitorPlay, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function VideoPlayer({ tmdbId, imdbId, title, type = 'movie', season, episode, posterPath, backdropPath, runtime }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const getWatchUrl = () => {
    let watchUrl = `/watch/${tmdbId}?type=${type}`;
    if (type === 'tv' && season && episode) {
      watchUrl += `&season=${season}&episode=${episode}`;
    }
    return watchUrl;
  };

  const handleWatchNow = () => {
    navigate(getWatchUrl());
  };

  if (!tmdbId) {
    return null;
  }

  const bgImage = backdropPath
    ? `https://image.tmdb.org/t/p/w780${backdropPath}`
    : posterPath
      ? `https://image.tmdb.org/t/p/w500${posterPath}`
      : null;

  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg shadow-lg shadow-red-500/20">
          <MonitorPlay className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            {t('videoPlayer.watchNow', 'Watch Now')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('videoPlayer.streamInstantly', 'Stream instantly in HD quality')}
          </p>
        </div>
      </div>

      {/* Compact Watch Card */}
      <div
        className="relative w-full rounded-xl overflow-hidden cursor-pointer group border border-white/10 hover:border-red-500/30 transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleWatchNow}
      >
        {/* Background with fixed height - Compact for better page flow */}
        <div className="relative h-28 sm:h-32 md:h-36">
          {/* Background Image */}
          {bgImage && (
            <div
              className="absolute inset-0 transition-transform duration-500 ease-out"
              style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
              }}
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/60" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center px-4 sm:px-6">
            <div className="flex items-center gap-4 sm:gap-6 w-full">
              {/* Play Button */}
              <div className="relative flex-shrink-0">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-red-600 to-orange-600 blur-lg transition-all duration-300 ${isHovered ? 'opacity-70 scale-125' : 'opacity-40 scale-100'}`} />
                <div className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-600 to-orange-600 shadow-xl transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white ml-0.5" />
                </div>
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  {type === 'tv' ? (
                    <Tv className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  ) : (
                    <Film className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-red-400 text-xs font-medium uppercase tracking-wide">
                    {type === 'tv' ? t('videoPlayer.tvSeries', 'TV Series') : t('videoPlayer.movie', 'Movie')}
                  </span>
                  {type === 'tv' && season && episode && (
                    <span className="text-white/50 text-xs">
                      S{season} E{episode}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {title}
                </h3>

                {/* Features Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-white/70 text-xs">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>HD</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-white/70 text-xs">
                    <Server className="w-3 h-3" />
                    <span>{t('videoPlayer.servers', '15+ Servers')}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-white/70 text-xs">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span>{t('videoPlayer.autoSwitch', 'Auto-Switch')}</span>
                  </div>
                  {runtime && (
                    <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-white/70 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{runtime}{t('movie.minutes', 'min')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Watch Button - Desktop */}
              <div className="hidden sm:block flex-shrink-0">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWatchNow();
                  }}
                  className={`gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-500/20 text-sm px-5 rounded-lg transition-all duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
                >
                  <Play className="w-4 h-4 fill-white" />
                  {t('videoPlayer.startWatching', 'Start Watching')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t('videoPlayer.multipleServers', 'Multiple servers available')}
        </p>
        <p className="flex items-center gap-1.5">
          <Globe className="w-3 h-3" />
          {t('videoPlayer.autoSwitchHint', 'Auto-switches on failure')}
        </p>
      </div>
    </section>
  );
}
