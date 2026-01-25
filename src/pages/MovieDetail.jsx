import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Calendar, Clock, Bookmark, BookmarkCheck, Globe, Film, Users, Award, Play } from 'lucide-react';
import { tmdbAPI, getImageUrl } from '@/services/tmdb';
import { useWatchlistStore, useRecentlyViewedStore, useAuthStore, useUserRatingsStore } from '@/store/useStore';
import StarRating from '@/components/movie/StarRating';
import MovieGrid from '@/components/movie/MovieGrid';
import Reviews from '@/components/movie/Reviews';
import Comments from '@/components/movie/Comments';
import Trailers from '@/components/movie/Trailers';
import CastCarousel from '@/components/movie/CastCarousel';
import CrewCarousel from '@/components/movie/CrewCarousel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Torrents from '@/components/movie/Torrents';
import WhereToWatch from '@/components/movie/WhereToWatch';
import BecauseYouWatched from '@/components/movie/BecauseYouWatched';
import VideoPlayer from '@/components/movie/VideoPlayer';
import { syncAPI } from '@/services/api';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function MovieDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('');
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore();
  const { addToRecentlyViewed } = useRecentlyViewedStore();
  const { token } = useAuthStore();
  const isInWatchlist = movie && watchlist.some((m) => m.id === movie.id);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await tmdbAPI.getMovieDetails(id);
        setMovie(response);

        // Add to recently viewed (local)
        if (response) {
          addToRecentlyViewed(response);
        }

        // Track view in backend (if logged in)
        if (response && token) {
          try {
            await axios.post(
              `/api/users/track-view/${id}`,
              { movieData: response },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            // Silently fail - view tracking is not critical
            console.debug('View tracking failed:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id, addToRecentlyViewed, token]);

  useEffect(() => {
    // Sync movie into local DB (non-blocking)
    if (!movie || !movie.id) return;
    setSyncStatus('');
    syncAPI.syncMovie(movie.id)
      .then((res) => {
        if (res?.message === 'Synced') {
          setSyncStatus('Synced just now');
        } else if (res?.message === 'Cached') {
          setSyncStatus('Cached');
        }
      })
      .catch(() => {
        setSyncStatus('');
      });
  }, [movie]);

  const handleWatchlistToggle = () => {
    if (isInWatchlist) {
      removeFromWatchlist(movie.id);
      toast.success(t('toasts.removedFromWatchlist'));
    } else {
      addToWatchlist(movie);
      toast.success(t('toasts.addedToWatchlist'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="h-[60vh] bg-muted animate-pulse" />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const backdropUrl = getImageUrl(movie.backdrop_path, 'original');
  const posterUrl = getImageUrl(movie.poster_path, 'w500');
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A';
  const imdbId = movie.external_ids?.imdb_id || movie.imdb_id;
  console.log('🎬 Movie:', movie.title);
  console.log('🔍 IMDB ID from TMDB:', imdbId);
  console.log('📋 Full external_ids:', movie.external_ids);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover scale-125 transition-transform "
            style={{ transitionDuration: '8000ms', transitionTimingFunction: 'ease-in-out' }}
            referrerPolicy="no-referrer"
            onLoad={(e) => {
                e.target.style.transform = 'scale(1)';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex flex-col md:flex-row gap-8 items-end md:items-center w-full">
            {/* Poster */}
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-48 md:w-64 rounded-lg shadow-2xl hidden sm:block"
            />

            {/* Info */}
            <div className="flex-1 space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-lg italic text-muted-foreground">
                  "{movie.tagline}"
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold text-lg">
                      {movie.vote_average.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({movie.vote_count} {t('movieDetail.votes')})
                    </span>
                  </div>
                )}
                {movie.release_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{year}</span>
                  </div>
                )}
                {movie.runtime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{runtime}</span>
                  </div>
                )}
              </div>

              {/* Sync status */}
              {syncStatus && (
                <div className="text-xs text-muted-foreground">{syncStatus}</div>
              )}

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <Badge key={genre.id} variant="secondary">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Your Rating */}
              <div className="flex items-center gap-4 p-3 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50 w-fit">
                <span className="text-sm font-medium text-muted-foreground">{t('movieDetail.yourRatingColon')}</span>
                <StarRating movie={movie} size="lg" showLabel={false} />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => document.getElementById('video-player-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                >
                  <Play className="h-5 w-5 fill-white" />
                  {t('videoPlayer.watchNow', 'Watch Now')}
                </Button>
                <Button size="lg" onClick={handleWatchlistToggle} variant="outline" className="gap-2">
                  {isInWatchlist ? (
                    <>
                      <BookmarkCheck className="h-5 w-5" />
                      {t('movieDetail.inWatchlist')}
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-5 w-5" />
                      {t('movieDetail.addToWatchlist')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Overview */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t('movieDetail.overview')}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {movie.overview || t('movieDetail.noOverview')}
          </p>
        </section>

        {/* Additional Info */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t('movieDetail.information')}</h2>
            <div className="space-y-3">
              {movie.status && (
                <div className="flex items-start gap-3">
                  <span className="font-semibold min-w-32">{t('movieDetail.status')}:</span>
                  <span className="text-muted-foreground">{movie.status}</span>
                </div>
              )}
              {movie.budget > 0 && (
                <div className="flex items-start gap-3">
                  <span className="font-semibold min-w-32">{t('movieDetail.budget')}:</span>
                  <span className="text-muted-foreground">
                    ${movie.budget.toLocaleString()}
                  </span>
                </div>
              )}
              {movie.revenue > 0 && (
                <div className="flex items-start gap-3">
                  <span className="font-semibold min-w-32">{t('movieDetail.revenue')}:</span>
                  <span className="text-muted-foreground">
                    ${movie.revenue.toLocaleString()}
                  </span>
                </div>
              )}
              {movie.original_language && (
                <div className="flex items-start gap-3">
                  <span className="font-semibold min-w-32">{t('movieDetail.language')}:</span>
                  <span className="text-muted-foreground">
                    {movie.original_language.toUpperCase()}
                  </span>
                </div>
              )}
              {movie.homepage && (
                <div className="flex items-start gap-3">
                  <span className="font-semibold min-w-32">{t('movieDetail.website')}:</span>
                  <a
                    href={movie.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Globe className="h-4 w-4" />
                    {t('movieDetail.officialSite')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Production Companies */}
          {movie.production_companies && movie.production_companies.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t('movieDetail.production')}</h2>
              <div className="space-y-3">
                {movie.production_companies.slice(0, 5).map((company) => (
                  <div key={company.id} className="flex items-center gap-3">
                    {company.logo_path ? (
                      <img
                        src={getImageUrl(company.logo_path, 'w200')}
                        alt={company.name}
                        className="h-8 object-contain"
                      />
                    ) : (
                      <Film className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground">{company.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Cast */}
        {movie.credits && movie.credits.cast && movie.credits.cast.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg shadow-purple-500/20">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('movieDetail.topCast')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {movie.credits.cast.length} {movie.credits.cast.length === 1 ? t('movieDetail.castMember') : t('movieDetail.castMembers')}
                </p>
              </div>
            </div>
            <CastCarousel cast={movie.credits.cast.slice(0, 20)} />
          </section>
        )}

        {/* Crew */}
        {movie.credits && movie.credits.crew && movie.credits.crew.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg shadow-lg shadow-amber-500/20">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {t('movieDetail.crew')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('movieDetail.crewSubtitle')}
                </p>
              </div>
            </div>
            <CrewCarousel crew={movie.credits.crew} />
          </section>
        )}

        {/* Trailers Section */}
        {movie.videos && <Trailers videos={movie.videos} />}

        {/* Video Player Section */}
        <div id="video-player-section">
          <VideoPlayer
            tmdbId={movie.id}
            imdbId={imdbId}
            title={movie.title}
            type="movie"
            posterPath={movie.poster_path}
            backdropPath={movie.backdrop_path}
          />
        </div>

        {/* Where to Watch Section */}
        <section>
          <WhereToWatch movieId={movie.id} />
        </section>

        {/* Torrents Section */}
        {imdbId && (
          <Torrents imdbId={imdbId} />
        )}

        {/* Because You Watched */}
        <section>
          <BecauseYouWatched movieId={id} movieTitle={movie.title} />
        </section>

        {/* Reviews Section */}
        <Reviews movieId={id} />

        {/* Comments Section */}
        <Comments movieId={id} />

        {/* Similar Movies */}
        {movie.similar && movie.similar.results && movie.similar.results.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">{t('movieDetail.similarMovies')}</h2>
            <MovieGrid movies={movie.similar.results.slice(0, 12)} />
          </section>
        )}
      </div>
    </div>
  );
}
