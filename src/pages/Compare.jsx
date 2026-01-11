import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, Plus, Search, Star, Calendar, Clock, DollarSign, TrendingUp, Award } from 'lucide-react';
import { tmdbAPI, getImageUrl } from '@/services/tmdb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import { useTranslation } from 'react-i18next';

export default function Compare() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const movieIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (movieIds.length > 0) {
      loadMovies(movieIds);
    }
  }, [searchParams]);

  const loadMovies = async (ids) => {
    setLoading(true);
    try {
      const promises = ids.map((id) => tmdbAPI.getMovieDetails(id));
      const results = await Promise.all(promises);
      setMovies(results);
    } catch (error) {
      console.error('Failed to load movies:', error);
      toast.error(t('compare.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await tmdbAPI.searchMovies(query);
      setSearchResults(response.results?.slice(0, 5) || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const addMovie = (movie) => {
    if (movies.length >= 4) {
      toast.error(t('compare.maxMovies'));
      return;
    }

    if (movies.some((m) => m.id === movie.id)) {
      toast.error(t('compare.alreadyAdded'));
      return;
    }

    const newMovies = [...movies, movie];
    setMovies(newMovies);
    updateURL(newMovies);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMovie = (movieId) => {
    const newMovies = movies.filter((m) => m.id !== movieId);
    setMovies(newMovies);
    updateURL(newMovies);
  };

  const updateURL = (movieList) => {
    if (movieList.length > 0) {
      setSearchParams({ ids: movieList.map((m) => m.id).join(',') });
    } else {
      setSearchParams({});
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return t('compare.na');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return t('compare.na');
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}${t('compare.hourShort')} ${mins}${t('compare.minuteShort')}`;
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('compare.title')}</h1>
        <p className="text-muted-foreground">
          {t('compare.subtitle')}
        </p>
      </div>

      {/* Search Box */}
      <Card className="p-6 mb-8">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('compare.search')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => addMovie(movie)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                >
                  <img
                    src={getImageUrl(movie.poster_path, 'w92')}
                    alt={movie.title}
                    className="w-12 h-18 object-cover rounded"
                    onError={(e) => (e.target.src = '/movie-poster-fallback.svg')}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{movie.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {movie.release_date?.split('-')[0]} • ⭐ {movie.vote_average?.toFixed(1)}
                    </div>
                  </div>
                  <Plus className="h-5 w-5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Comparison Table */}
      {movies.length === 0 ? (
        <Card className="p-12 text-center">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">{t('compare.noMovieSelected')}</h3>
          <p className="text-muted-foreground">
            {t('compare.selectMovie')}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold bg-muted/50 sticky left-0 z-10">
                  {t('compare.property')}
                </th>
                {movies.map((movie) => (
                  <th key={movie.id} className="p-4 min-w-[250px]">
                    <div className="relative group">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMovie(movie.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Link to={`/movie/${movie.id}`}>
                        <img
                          src={getImageUrl(movie.poster_path, 'w342')}
                          alt={movie.title}
                          className="w-full h-80 object-cover rounded-lg mb-3 hover:scale-105 transition-transform"
                          onError={(e) => (e.target.src = '/movie-poster-fallback.svg')}
                        />
                      </Link>
                      <h3 className="font-bold text-lg mb-1">{movie.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {movie.release_date?.split('-')[0]}
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Rating */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-semibold bg-muted/30 sticky left-0">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    {t('compare.rating')}
                  </div>
                </td>
                {movies.map((movie) => (
                  <td key={movie.id} className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      <span className="text-xl font-bold">{movie.vote_average?.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">/ 10</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {movie.vote_count?.toLocaleString()} {t('compare.votes')}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Release Date */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-semibold bg-muted/30 sticky left-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('compare.releaseDate')}
                  </div>
                </td>
                {movies.map((movie) => (
                  <td key={movie.id} className="p-4 text-center">
                    {movie.release_date
                      ? new Date(movie.release_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : t('compare.na')}
                  </td>
                ))}
              </tr>

              {/* Runtime */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-semibold bg-muted/30 sticky left-0">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('compare.runtime')}
                  </div>
                </td>
                {movies.map((movie) => (
                  <td key={movie.id} className="p-4 text-center">
                    {formatRuntime(movie.runtime)}
                  </td>
                ))}
              </tr>

              {/* Budget */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-semibold bg-muted/30 sticky left-0">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t('compare.budget')}
                  </div>
                </td>
                {movies.map((movie) => (
                  <td key={movie.id} className="p-4 text-center">
                    {formatCurrency(movie.budget)}
                  </td>
                ))}
              </tr>

              {/* Revenue */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-semibold bg-muted/30 sticky left-0">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t('compare.revenue')}
                  </div>
                </td>
                {movies.map((movie) => (
                  <td key={movie.id} className="p-4 text-center">
                    {formatCurrency(movie.revenue)}
                  </td>
                ))}
              </tr>

              {/* Genres */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-semibold bg-muted/30 sticky left-0">{t('compare.genres')}</td>
                {movies.map((movie) => (
                  <td key={movie.id} className="p-4">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {movie.genres?.map((genre) => (
                        <Badge key={genre.id} variant="secondary">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Top Cast */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-semibold bg-muted/30 sticky left-0">{t('compare.topCast')}</td>
                {movies.map((movie) => (
                  <td key={movie.id} className="p-4">
                    <div className="text-sm space-y-1">
                      {movie.credits?.cast?.slice(0, 5).map((actor) => (
                        <div key={actor.id} className="text-center">
                          {actor.name}
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Director */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-semibold bg-muted/30 sticky left-0">{t('compare.director')}</td>
                {movies.map((movie) => {
                  const director = movie.credits?.crew?.find((person) => person.job === 'Director');
                  return (
                    <td key={movie.id} className="p-4 text-center">
                      {director?.name || t('compare.na')}
                    </td>
                  );
                })}
              </tr>

              {/* Tagline */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-semibold bg-muted/30 sticky left-0">{t('compare.tagline')}</td>
                {movies.map((movie) => (
                  <td key={movie.id} className="p-4 text-center italic text-muted-foreground">
                    {movie.tagline || t('compare.na')}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
