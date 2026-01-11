import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Server,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Check,
  Home,
  Info,
  Zap,
  Shield,
  X,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  SkipForward,
  Settings,
  Star,
  Clock,
  Monitor,
  Keyboard,
  Volume2,
  VolumeX,
  Volume1,
  ChevronRight,
  Loader2,
  Radio,
  Sparkles,
  PictureInPicture2,
  Crown,
  Tv,
  Gauge,
  Moon,
  PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { fetchMovieDetails, fetchTVDetails } from '@/services/tmdb';
import MetaTags from '@/components/common/MetaTags';
import { useWatchHistoryStore } from '@/store/useStore';

// Provider health tracking in localStorage
const PROVIDER_HEALTH_KEY = 'movies-to-provider-health';

const getProviderHealth = () => {
  try {
    const stored = localStorage.getItem(PROVIDER_HEALTH_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const updateProviderHealth = (providerId, success) => {
  try {
    const health = getProviderHealth();
    const current = health[providerId] || { successes: 0, failures: 0, lastUsed: 0 };
    health[providerId] = {
      successes: success ? current.successes + 1 : current.successes,
      failures: success ? current.failures : current.failures + 1,
      lastUsed: Date.now(),
    };
    localStorage.setItem(PROVIDER_HEALTH_KEY, JSON.stringify(health));
  } catch {
    // Ignore storage errors
  }
};

const getProviderScore = (providerId) => {
  const health = getProviderHealth()[providerId];
  if (!health) return 0;
  const total = health.successes + health.failures;
  if (total === 0) return 0;
  return (health.successes / total) * 100;
};

// Embed providers configuration - VidSrc.to is the primary recommended source
const BASE_EMBED_PROVIDERS = [
  // PRIMARY RECOMMENDED - VidSrc.to
  {
    id: 'vidsrc-to',
    name: 'VidSrc.to',
    getUrl: (tmdbId, type = 'movie') => `https://vidsrc.to/embed/${type}/${tmdbId}`,
    priority: 1,
    category: 'recommended',
    quality: 'FHD',
    isRecommended: true,
    description: 'Best quality & reliability',
  },
  {
    id: 'embed-su',
    name: 'HyperStream',
    getUrl: (tmdbId, type = 'movie') => `https://embed.su/embed/${type}/${tmdbId}`,
    priority: 2,
    category: 'premium',
    quality: 'HD',
  },
  {
    id: 'vidsrc-icu',
    name: 'VidCloud',
    getUrl: (tmdbId, type = 'movie') => `https://vidsrc.icu/embed/${type}/${tmdbId}`,
    priority: 3,
    category: 'premium',
    quality: 'HD',
  },
  {
    id: 'vidsrc-dev',
    name: 'StreamMax',
    getUrl: (tmdbId, type = 'movie') => `https://vidsrc.dev/embed/${type}/${tmdbId}`,
    priority: 4,
    category: 'premium',
    quality: 'HD',
  },
  {
    id: 'multiembed',
    name: 'MultiStream',
    getUrl: (tmdbId, type = 'movie') => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    priority: 5,
    category: 'premium',
    quality: 'HD',
  },
  {
    id: 'vidsrc-cc',
    name: 'CinemaCloud',
    getUrl: (tmdbId, type = 'movie') => `https://vidsrc.cc/v2/embed/${type}/${tmdbId}`,
    priority: 6,
    category: 'premium',
    quality: 'FHD',
  },
  // Standard providers
  {
    id: 'autoembed',
    name: 'AutoPlay',
    getUrl: (tmdbId, type = 'movie') => `https://autoembed.co/${type}/tmdb/${tmdbId}`,
    priority: 7,
    category: 'standard',
    quality: 'HD',
  },
  {
    id: 'smashystream',
    name: 'Smashy',
    getUrl: (tmdbId, type = 'movie') => `https://player.smashy.stream/${type}/${tmdbId}`,
    priority: 8,
    category: 'standard',
    quality: 'HD',
  },
  {
    id: '2embed',
    name: 'DualStream',
    getUrl: (tmdbId, type = 'movie') => `https://www.2embed.stream/embed/${type}/${tmdbId}`,
    priority: 9,
    category: 'standard',
    quality: 'HD',
  },
  {
    id: 'vidsrc-xyz',
    name: 'XYZPlayer',
    getUrl: (tmdbId, type = 'movie') => `https://vidsrc.xyz/embed/${type}/${tmdbId}`,
    priority: 10,
    category: 'standard',
    quality: 'HD',
  },
  {
    id: 'moviesapi',
    name: 'MovieHub',
    getUrl: (tmdbId, type = 'movie') => `https://moviesapi.club/${type}/${tmdbId}`,
    priority: 11,
    category: 'standard',
    quality: 'HD',
  },
  // Backup providers
  {
    id: 'vidsrc-nl',
    name: 'NordStream',
    getUrl: (tmdbId, type = 'movie') => `https://player.vidsrc.nl/embed/${type}/${tmdbId}`,
    priority: 12,
    category: 'backup',
    quality: 'SD',
  },
  {
    id: 'superembed',
    name: 'SuperPlay',
    getUrl: (tmdbId, type = 'movie') => `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`,
    priority: 13,
    category: 'backup',
    quality: 'HD',
  },
  {
    id: 'vidlink',
    name: 'VidLink',
    getUrl: (tmdbId, type = 'movie') => `https://vidlink.pro/embed/${type}/${tmdbId}`,
    priority: 14,
    category: 'backup',
    quality: 'HD',
  },
  {
    id: 'vidbinge',
    name: 'BingeWatch',
    getUrl: (tmdbId, type = 'movie') => `https://vidbinge.dev/embed/${type}/${tmdbId}`,
    priority: 15,
    category: 'backup',
    quality: 'HD',
  },
];

const getSortedProviders = () => {
  return [...BASE_EMBED_PROVIDERS].sort((a, b) => {
    // Always keep VidSrc.to first as recommended
    if (a.isRecommended) return -1;
    if (b.isRecommended) return 1;
    const scoreA = getProviderScore(a.id);
    const scoreB = getProviderScore(b.id);
    if (scoreA > 0 && scoreB > 0) return scoreB - scoreA;
    if (scoreA > 50) return -1;
    if (scoreB > 50) return 1;
    return a.priority - b.priority;
  });
};

export default function Watch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const type = searchParams.get('type') || 'movie';
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');

  const { addToWatchHistory, updateWatchProgress, getWatchHistory } = useWatchHistoryStore();
  const EMBED_PROVIDERS = useMemo(() => getSortedProviders(), []);

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentProvider, setCurrentProvider] = useState(EMBED_PROVIDERS[0]);
  const [failedProviders, setFailedProviders] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showServerPanel, setShowServerPanel] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showBlockedNotice, setShowBlockedNotice] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [autoSwitching, setAutoSwitching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [serverCategory, setServerCategory] = useState('all');
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);

  // New feature states
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(80);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1x');
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const [watchStartTime, setWatchStartTime] = useState(null);

  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const loadCheckRef = useRef(null);
  const volumeSliderRef = useRef(null);
  const speedMenuRef = useRef(null);

  // Playback speed options
  const speedOptions = ['0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x'];

  // Check PiP support
  useEffect(() => {
    if ('documentPictureInPicture' in window) {
      setIsPiPSupported(true);
    }
  }, []);

  // Check for saved watch position on mount
  useEffect(() => {
    if (content && id) {
      const contentId = `${type}-${content.id}`;
      const history = getWatchHistory();
      const savedItem = history.find(item => item.contentId === contentId);

      if (savedItem && savedItem.progress > 5 && savedItem.progress < 95) {
        setSavedProgress(savedItem);
        setShowResumePrompt(true);

        // Auto-hide resume prompt after 10 seconds
        const timeout = setTimeout(() => {
          setShowResumePrompt(false);
        }, 10000);

        return () => clearTimeout(timeout);
      }
    }
  }, [content, id, type, getWatchHistory]);

  // Track watch start time
  useEffect(() => {
    if (iframeLoaded) {
      setWatchStartTime(Date.now());
    }
  }, [iframeLoaded]);

  // Save watch progress periodically and on unmount
  useEffect(() => {
    if (content && iframeLoaded && watchStartTime) {
      const saveProgress = () => {
        const watchDuration = Math.floor((Date.now() - watchStartTime) / 1000);
        const estimatedDuration = content.runtime ? content.runtime * 60 : (type === 'tv' ? 45 * 60 : 120 * 60);
        const progressPercent = Math.min(95, Math.floor((watchDuration / estimatedDuration) * 100) + (savedProgress?.progress || 0));

        const contentId = `${type}-${content.id}`;
        updateWatchProgress(contentId, progressPercent);

        // Save to localStorage for resume
        const watchData = {
          contentId,
          progress: progressPercent,
          watchDuration,
          lastWatched: Date.now(),
          season: season ? parseInt(season) : null,
          episode: episode ? parseInt(episode) : null,
          provider: currentProvider.name,
        };

        try {
          const savedWatches = JSON.parse(localStorage.getItem('movies-to-watch-progress') || '{}');
          savedWatches[contentId] = watchData;
          localStorage.setItem('movies-to-watch-progress', JSON.stringify(savedWatches));
        } catch (e) {
          console.error('Error saving watch progress:', e);
        }
      };

      // Save every 30 seconds
      const interval = setInterval(saveProgress, 30000);

      // Save on unmount
      return () => {
        clearInterval(interval);
        saveProgress();
      };
    }
  }, [content, iframeLoaded, watchStartTime, savedProgress, type, season, episode, currentProvider.name, updateWatchProgress]);

  // Theater mode effect - apply body class
  useEffect(() => {
    if (isTheaterMode) {
      document.body.classList.add('theater-mode-active');
    } else {
      document.body.classList.remove('theater-mode-active');
    }

    return () => {
      document.body.classList.remove('theater-mode-active');
    };
  }, [isTheaterMode]);

  // Close volume slider and speed menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(e.target)) {
        setShowVolumeSlider(false);
      }
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) {
        setShowSpeedMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch content details
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = type === 'tv'
          ? await fetchTVDetails(id)
          : await fetchMovieDetails(id);
        setContent(data);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [id, type]);

  // Track watch history
  useEffect(() => {
    if (content && iframeLoaded) {
      addToWatchHistory(content, {
        type,
        progress: 10,
        duration: content.runtime || (type === 'tv' ? 45 : 120),
        season: season ? parseInt(season) : null,
        episode: episode ? parseInt(episode) : null,
        provider: currentProvider.name,
      });

      const progressInterval = setInterval(() => {
        const contentId = `${type}-${content.id}`;
        updateWatchProgress(contentId, (prev) => Math.min(90, (prev || 10) + 5));
      }, 60000);

      return () => clearInterval(progressInterval);
    }
  }, [content, iframeLoaded, type, season, episode, currentProvider.name, addToWatchHistory, updateWatchProgress]);

  // Keyboard shortcuts - update with new shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showServerPanel) setShowServerPanel(false);
        else if (showShortcuts) setShowShortcuts(false);
        else if (showVolumeSlider) setShowVolumeSlider(false);
        else if (showSpeedMenu) setShowSpeedMenu(false);
        else if (isFullscreen) handleFullscreenToggle();
        else if (isTheaterMode) setIsTheaterMode(false);
      }
      if (e.key === 'f' || e.key === 'F') handleFullscreenToggle();
      if (e.key === 's' || e.key === 'S') setShowServerPanel(!showServerPanel);
      if (e.key === '?' || (e.shiftKey && e.key === '/')) setShowShortcuts(!showShortcuts);
      if (e.key === 'n' || e.key === 'N') handleNextServer();
      if (e.key === 'p' || e.key === 'P') handlePiPToggle();
      if (e.key === 't' || e.key === 'T') setIsTheaterMode(!isTheaterMode);
      if (e.key === 'm' || e.key === 'M') setShowVolumeSlider(!showVolumeSlider);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showServerPanel, showShortcuts, isFullscreen, isTheaterMode, showVolumeSlider, showSpeedMenu]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (iframeLoaded && !showServerPanel) setShowControls(false);
      }, 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [iframeLoaded, showServerPanel]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getEmbedUrl = useCallback((provider) => {
    let url = provider.getUrl(id, type);
    if (type === 'tv' && season && episode) {
      if (provider.id === 'multiembed' || provider.id === 'superembed') {
        url += `&s=${season}&e=${episode}`;
      } else {
        url += `/${season}/${episode}`;
      }
    }
    return url;
  }, [id, type, season, episode]);

  const switchProvider = useCallback((provider, isAutoSwitch = false) => {
    setCurrentProvider(provider);
    setShowServerPanel(false);
    setLoadError(false);
    setIsLoading(true);
    setShowBlockedNotice(false);
    setIframeLoaded(false);
    setAutoSwitching(isAutoSwitch);
  }, []);

  const handleNextServer = useCallback(() => {
    const currentIndex = EMBED_PROVIDERS.findIndex(p => p.id === currentProvider.id);
    const nextIndex = (currentIndex + 1) % EMBED_PROVIDERS.length;
    switchProvider(EMBED_PROVIDERS[nextIndex], false);
  }, [currentProvider.id, EMBED_PROVIDERS, switchProvider]);

  const handleProviderError = useCallback(() => {
    updateProviderHealth(currentProvider.id, false);
    const newFailedProviders = new Set(failedProviders);
    newFailedProviders.add(currentProvider.id);
    setFailedProviders(newFailedProviders);

    const availableProviders = EMBED_PROVIDERS.filter(p => !newFailedProviders.has(p.id));
    if (availableProviders.length > 0) {
      switchProvider(availableProviders[0], true);
    } else {
      setLoadError(true);
      setAutoSwitching(false);
    }
  }, [failedProviders, currentProvider.id, EMBED_PROVIDERS, switchProvider]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setIframeLoaded(true);
    setAutoSwitching(false);
    updateProviderHealth(currentProvider.id, true);
    [timeoutRef, loadCheckRef].forEach(ref => {
      if (ref.current) clearTimeout(ref.current);
    });
  }, [currentProvider.id]);

  const handleIframeError = () => {
    setShowBlockedNotice(true);
    handleProviderError();
  };

  useEffect(() => {
    [timeoutRef, loadCheckRef].forEach(ref => {
      if (ref.current) clearTimeout(ref.current);
    });

    loadCheckRef.current = setTimeout(() => {
      if (isLoading && !iframeLoaded) setShowBlockedNotice(true);
    }, 4000);

    timeoutRef.current = setTimeout(() => {
      if (isLoading && !iframeLoaded) handleProviderError();
    }, 8000);

    return () => {
      [timeoutRef, loadCheckRef].forEach(ref => {
        if (ref.current) clearTimeout(ref.current);
      });
    };
  }, [currentProvider, isLoading, iframeLoaded, handleProviderError]);

  const handleRetry = () => {
    setFailedProviders(new Set());
    setCurrentProvider(EMBED_PROVIDERS[0]);
    setLoadError(false);
    setIsLoading(true);
    setShowBlockedNotice(false);
    setIframeLoaded(false);
    setAutoSwitching(false);
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Picture-in-Picture toggle
  const handlePiPToggle = async () => {
    try {
      if ('documentPictureInPicture' in window) {
        if (isPiPActive) {
          // Close PiP window
          window.documentPictureInPicture?.window?.close();
          setIsPiPActive(false);
        } else {
          // Open in Document PiP
          const pipWindow = await window.documentPictureInPicture.requestWindow({
            width: 640,
            height: 360,
          });

          // Create mini player
          pipWindow.document.body.innerHTML = `
            <div style="width: 100%; height: 100%; background: #000;">
              <iframe
                src="${getEmbedUrl(currentProvider)}"
                style="width: 100%; height: 100%; border: none;"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowfullscreen
              ></iframe>
            </div>
          `;
          pipWindow.document.body.style.margin = '0';
          pipWindow.document.body.style.padding = '0';
          pipWindow.document.body.style.overflow = 'hidden';

          setIsPiPActive(true);

          pipWindow.addEventListener('pagehide', () => {
            setIsPiPActive(false);
          });
        }
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const handleClose = () => navigate(-1);

  const availableProviders = EMBED_PROVIDERS.filter(p => !failedProviders.has(p.id));
  const filteredProviders = serverCategory === 'all'
    ? EMBED_PROVIDERS
    : serverCategory === 'recommended'
      ? EMBED_PROVIDERS.filter(p => p.isRecommended || p.category === 'recommended')
      : EMBED_PROVIDERS.filter(p => p.category === serverCategory);

  const title = content?.title || content?.name || 'Watch';
  const year = content?.release_date?.split('-')[0] || content?.first_air_date?.split('-')[0];
  const rating = content?.vote_average?.toFixed(1);
  const posterPath = content?.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : null;
  const backdropPath = content?.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : null;

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-white/10 border-t-red-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-8 h-8 text-red-500 fill-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-white font-medium">{t('watch.preparingStream')}</p>
            <p className="text-white/40 text-sm">{t('watch.loadingContent')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MetaTags
        title={`Watch ${title} - Movies.to`}
        description={`Stream ${title} online in HD quality`}
        image={backdropPath || posterPath}
      />

      {/* Theater Mode Overlay */}
      {isTheaterMode && (
        <div
          className="fixed inset-0 bg-black/90 z-40 transition-opacity duration-300"
          onClick={() => setIsTheaterMode(false)}
        />
      )}

      <div className={`min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black ${isTheaterMode ? 'relative z-50' : ''}`}>
        <div ref={containerRef} className={`relative ${isTheaterMode ? 'max-w-6xl mx-auto px-4 pt-4' : 'max-w-[1600px] mx-auto'}`}>
          {/* Ambient Background - only show when not fullscreen */}
          {backdropPath && !isFullscreen && !isTheaterMode && (
            <div
              className="absolute inset-0 opacity-10 blur-3xl scale-110 pointer-events-none"
              style={{
                backgroundImage: `url(${backdropPath})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}

          {/* Resume Prompt */}
          {showResumePrompt && savedProgress && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/95 border border-white/10 shadow-2xl backdrop-blur-xl">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{t('watch.continueWatching')}</p>
                  <p className="text-white/50 text-xs">{t('watch.resumeFrom')} {savedProgress.progress}% • {formatTimeAgo(savedProgress.lastWatched, t)}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    size="sm"
                    onClick={() => setShowResumePrompt(false)}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs px-3"
                  >
                    {t('watch.resume')}
                  </Button>
                  <button
                    onClick={() => {
                      setSavedProgress(null);
                      setShowResumePrompt(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Video Player Section - FIXED: Compact sizing with always-visible controls */}
          <div className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl ${
            isFullscreen
              ? 'fixed inset-0 z-50 rounded-none'
              : isTheaterMode
                ? 'aspect-video max-h-[80vh0vh]'
                : 'aspect-video max-h-[60vh] sm:max-h-[30vh] md:max-h-[32vh] lg:max-h-[35vh] xl:max-h-[38vh]'
          }`}>
            {loadError && availableProviders.length === 0 ? (
              /* Error State */
              <div className="absolute inset-0 flex items-center justify-center p-6 bg-zinc-900">
                <div className="max-w-md w-full text-center space-y-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">{t('watch.unableToStream')}</h2>
                    <p className="text-white/50">
                      {t('watch.allServersUnavailable')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      size="lg"
                      onClick={handleRetry}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      {t('watch.tryAgain')}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleClose}
                      className="w-full border-white/20 hover:bg-white/10"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      {t('watch.goBack')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/95">
                    <div className="text-center space-y-8 max-w-sm px-6">
                      {/* Animated Loader */}
                      <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-white font-semibold text-lg">
                          {autoSwitching ? t('watch.findingBestServer') : t('watch.connectingToStream')}
                        </h3>
                        <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                          <Server className="w-4 h-4" />
                          <span>{currentProvider.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-xs">
                            {currentProvider.quality}
                          </span>
                        </div>
                      </div>

                      {/* Server count */}
                      <div className="flex items-center justify-center gap-1">
                        {EMBED_PROVIDERS.slice(0, 5).map((p, i) => (
                          <div
                            key={p.id}
                            className={`w-2 h-2 rounded-full transition-all ${
                              p.id === currentProvider.id
                                ? 'bg-red-500 scale-125'
                                : failedProviders.has(p.id)
                                  ? 'bg-red-500/30'
                                  : 'bg-white/20'
                            }`}
                          />
                        ))}
                        {EMBED_PROVIDERS.length > 5 && (
                          <span className="text-white/30 text-xs ml-1">+{EMBED_PROVIDERS.length - 5}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Slow Connection Notice */}
                {showBlockedNotice && !iframeLoaded && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/98 p-6">
                    <div className="max-w-md w-full text-center space-y-6">
                      <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Shield className="w-10 h-10 text-amber-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">{t('watch.slowConnection')}</h3>
                        <p className="text-white/50 text-sm">
                          {t('watch.slowConnectionDesc')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={handleNextServer}
                          className="w-full bg-gradient-to-r from-red-600 to-orange-600"
                        >
                          <SkipForward className="w-4 h-4 mr-2" />
                          {t('watch.tryNextServer')}
                        </Button>
                        <button
                          onClick={() => setShowBlockedNotice(false)}
                          className="text-white/40 text-sm hover:text-white/60 transition-colors py-2"
                        >
                          {t('watch.continueWaiting')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Player */}
                <iframe
                  ref={iframeRef}
                  src={getEmbedUrl(currentProvider)}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  referrerPolicy="no-referrer-when-downgrade"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />

                {/* Player Controls Overlay */}
                <div
                  className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="bg-gradient-to-b from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      {/* Title & Info */}
                      <div className="flex items-center gap-3">
                        <Link
                          to={type === 'tv' ? `/tv/${id}` : `/movie/${id}`}
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <ArrowLeft className="w-5 h-5 text-white" />
                        </Link>
                        <div>
                          <h1 className="text-white font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-md">
                            {title}
                          </h1>
                          <div className="flex items-center gap-2 text-white/50 text-xs">
                            {year && <span>{year}</span>}
                            {rating && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                  {rating}
                                </span>
                              </>
                            )}
                            {type === 'tv' && season && episode && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <span>S{season} E{episode}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        {/* Theater Mode Indicator */}
                        {isTheaterMode && (
                          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            <Moon className="w-3 h-3" />
                            <span>{t('watch.theater')}</span>
                          </div>
                        )}

                        {/* Connection Status */}
                        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                          iframeLoaded
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : autoSwitching
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-white/10 text-white/60 border border-white/10'
                        }`}>
                          {iframeLoaded ? (
                            <>
                              <Radio className="w-3 h-3" />
                              <span>{t('watch.live')}</span>
                            </>
                          ) : autoSwitching ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>{t('watch.switching')}</span>
                            </>
                          ) : (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>{t('watch.connecting')}</span>
                            </>
                          )}
                        </div>

                        <button
                          onClick={handleFullscreenToggle}
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                          title="Toggle fullscreen (F)"
                        >
                          {isFullscreen ? (
                            <Minimize2 className="w-5 h-5 text-white" />
                          ) : (
                            <Maximize2 className="w-5 h-5 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Controls Bar Below Player - FIXED: Always visible with proper positioning and styling */}
          <div className="relative z-40 bg-zinc-900/95 border border-white/10 backdrop-blur-xl mt-2 shadow-xl rounded-xl">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
                {/* Server Selector Button */}
                <button
                  onClick={() => setShowServerPanel(!showServerPanel)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg transition-all ${
                    showServerPanel
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="relative">
                    <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {iframeLoaded && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className="font-medium text-xs sm:text-sm">{currentProvider.name}</span>
                  <span className={`hidden sm:inline px-1.5 py-0.5 rounded text-xs font-medium ${
                    currentProvider.quality === 'FHD'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-white/10 text-white/60'
                  }`}>
                    {currentProvider.quality}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showServerPanel ? 'rotate-180' : ''}`} />
                </button>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* Volume Control */}
                  <div className="relative hidden sm:block" ref={volumeSliderRef}>
                    <button
                      onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all ${
                        showVolumeSlider
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      }`}
                      title="Volume control (M)"
                    >
                      {volumeLevel === 0 ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : volumeLevel < 50 ? (
                        <Volume1 className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden md:inline text-xs font-medium">{volumeLevel}%</span>
                    </button>

                    {/* Volume Slider Popup */}
                    {showVolumeSlider && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl min-w-[180px]">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white/70 text-xs">{t('watch.volume')}</span>
                            <span className="text-white font-medium text-xs">{volumeLevel}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volumeLevel}
                            onChange={(e) => setVolumeLevel(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                          />
                          <p className="text-white/40 text-[10px] flex items-center gap-1 pt-1 border-t border-white/10">
                            <Info className="w-2.5 h-2.5" />
                            {t('watch.volumeNote')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Playback Speed */}
                  <div className="relative hidden sm:block" ref={speedMenuRef}>
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all ${
                        showSpeedMenu
                          ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      }`}
                      title="Playback speed"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{playbackSpeed}</span>
                    </button>

                    {/* Speed Menu Popup */}
                    {showSpeedMenu && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl min-w-[120px]">
                        <div className="space-y-0.5">
                          <p className="text-white/50 text-[10px] px-2 pb-1">{t('watch.playbackSpeed')}</p>
                          {speedOptions.map((speed) => (
                            <button
                              key={speed}
                              onClick={() => {
                                setPlaybackSpeed(speed);
                                setShowSpeedMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                                playbackSpeed === speed
                                  ? 'bg-violet-500/20 text-violet-400'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              <span>{speed}</span>
                              {playbackSpeed === speed && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Theater Mode Toggle */}
                  <button
                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                    className={`hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all ${
                      isTheaterMode
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                        : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    }`}
                    title={`${t('watch.toggleTheater')} (T)`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline text-xs font-medium">{t('watch.theater')}</span>
                  </button>

                  <button
                    onClick={handleNextServer}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
                    title={`${t('watch.nextServer')} (N)`}
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs font-medium">{t('watch.tryNextServer')}</span>
                  </button>

                  {/* Picture-in-Picture Button */}
                  {isPiPSupported && (
                    <button
                      onClick={handlePiPToggle}
                      className={`hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all ${
                        isPiPActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      }`}
                      title={`${t('watch.pictureInPicture')} (P)`}
                    >
                      <PictureInPicture2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={handleRetry}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
                    title="Reset all servers"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleFullscreenToggle}
                    className="p-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white transition-all"
                    title="Fullscreen (F)"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowShortcuts(true)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all hidden lg:flex"
                    title="Keyboard shortcuts (?)"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    to={type === 'tv' ? `/tv/${id}` : `/movie/${id}`}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
                    title="View details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Server Selection Panel */}
        {showServerPanel && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm">
            <div
              className="w-full max-w-2xl max-h-[80vh] bg-zinc-900/95 border border-white/10 rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{t('watch.selectServer')}</h2>
                  <p className="text-white/40 text-sm">{availableProviders.length} {t('watch.serversAvailable')}</p>
                </div>
                <button
                  onClick={() => setShowServerPanel(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Category Tabs */}
              <div className="px-6 py-3 border-b border-white/5 flex gap-2 overflow-x-auto">
                {[
                  { id: 'all', label: t('watch.all'), icon: Monitor },
                  { id: 'premium', label: t('watch.premium'), icon: Sparkles },
                  { id: 'standard', label: t('watch.standard'), icon: Server },
                  { id: 'backup', label: t('watch.backup'), icon: Shield },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setServerCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      serverCategory === cat.id
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Server List */}
              <div className="p-4 max-h-80 overflow-y-auto space-y-2">
                {filteredProviders.map((provider) => {
                  const isFailed = failedProviders.has(provider.id);
                  const isCurrent = provider.id === currentProvider.id;
                  const score = getProviderScore(provider.id);

                  return (
                    <button
                      key={provider.id}
                      onClick={() => !isFailed && switchProvider(provider)}
                      disabled={isFailed}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30'
                          : isFailed
                            ? 'bg-white/5 opacity-40 cursor-not-allowed'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isCurrent
                            ? 'bg-red-500/30'
                            : provider.category === 'premium'
                              ? 'bg-amber-500/20'
                              : 'bg-white/10'
                        }`}>
                          {provider.category === 'premium' ? (
                            <Sparkles className="w-5 h-5 text-amber-400" />
                          ) : (
                            <Server className="w-5 h-5 text-white/60" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isCurrent ? 'text-red-400' : 'text-white'}`}>
                              {provider.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">
                              {provider.quality}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {score > 70 && (
                              <span className="text-xs text-emerald-400 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {t('watch.reliable')}
                              </span>
                            )}
                            {isFailed && (
                              <span className="text-xs text-red-400">{t('watch.failed')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrent && <Check className="w-5 h-5 text-red-400" />}
                        {!isCurrent && !isFailed && <ChevronRight className="w-5 h-5 text-white/30" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={() => setShowServerPanel(false)} />
          </div>
        )}

        {/* Keyboard Shortcuts Modal - Updated with new shortcuts */}
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-zinc-900/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{t('keyboardShortcuts.title')}</h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { key: 'F', action: t('keyboardShortcuts.shortcuts.toggleFullscreen') },
                  { key: 'T', action: t('keyboardShortcuts.shortcuts.toggleTheater') },
                  { key: 'M', action: t('keyboardShortcuts.shortcuts.toggleVolume') },
                  { key: 'P', action: t('keyboardShortcuts.shortcuts.pictureInPicture') },
                  { key: 'S', action: t('keyboardShortcuts.shortcuts.openServerList') },
                  { key: 'N', action: t('keyboardShortcuts.shortcuts.nextServer') },
                  { key: 'Esc', action: t('keyboardShortcuts.shortcuts.closeModal') },
                  { key: '?', action: t('keyboardShortcuts.shortcuts.showShortcuts') },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2">
                    <span className="text-white/70">{shortcut.action}</span>
                    <kbd className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={() => setShowShortcuts(false)} />
          </div>
        )}
      </div>
    </>
  );
}

// Helper function to format time ago
function formatTimeAgo(timestamp, t) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return t?.('watch.justNow') || 'just now';
  if (seconds < 3600) return t?.('watch.minutesAgo', { count: Math.floor(seconds / 60) }) || `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return t?.('watch.hoursAgo', { count: Math.floor(seconds / 3600) }) || `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return t?.('watch.daysAgo', { count: Math.floor(seconds / 86400) }) || `${Math.floor(seconds / 86400)}d ago`;
  return t?.('watch.weeksAgo', { count: Math.floor(seconds / 604800) }) || `${Math.floor(seconds / 604800)}w ago`;
}
