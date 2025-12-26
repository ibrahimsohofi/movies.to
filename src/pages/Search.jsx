import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Film, Filter, X, Calendar, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tmdbAPI } from '@/services/tmdb';
import MovieGrid from '@/components/movie/MovieGrid';
import EmptyState from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

export default function Search() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    genre: '',
    year: '',
    minRating: 0,
    sortBy: 'popularity.desc',
  });

  useEffect(() => {
    // Fetch genres
    const fetchGenres = async () => {
      try {
        const response = await tmdbAPI.getGenres();
        setGenres(response.genres || []);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query && !filters.genre && !filters.year && filters.minRating === 0) {
        setMovies([]);
        return;
      }

      try {
        setLoading(true);

        // Use search if there's a query, otherwise use discover with filters
        let response;
        if (query) {
          response = await tmdbAPI.searchMovies(query);
        } else {
          const discoverFilters = {
            sort_by: filters.sortBy,
          };
          if (filters.genre) discoverFilters.with_genres = filters.genre;
          if (filters.year) discoverFilters.primary_release_year = filters.year;
          if (filters.minRating > 0) discoverFilters['vote_average.gte'] = filters.minRating;

          response = await tmdbAPI.discoverMovies(discoverFilters);
        }

        setMovies(response.results || []);
      } catch (error) {
        console.error('Error searching movies:', error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      genre: '',
      year: '',
      minRating: 0,
      sortBy: 'popularity.desc',
    });
  };

  const hasActiveFilters = filters.genre || filters.year || filters.minRating > 0;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Search Input */}
      <div className="mb-8 animate-slide-in-up">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
          {t('search.title', 'Search Movies')}
        </h1>
        <p className="text-muted-foreground mb-6">{t('search.description', 'Discover your next favorite film')}</p>
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative group">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-300" />
            <Input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 text-lg h-14 border-2 focus:border-red-600 focus:ring-red-600/20 rounded-xl shadow-lg shadow-red-500/5 transition-all duration-300"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full hover:bg-red-100 dark:hover:bg-red-950"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Results */}
      {query && (
        <div className="mb-6 animate-slide-in-up">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-muted-foreground text-lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  {t('search.searching', 'Searching...')}
                </span>
              ) : (
                <>
                  {t('search.found', 'Found')} <span className="font-bold text-red-600">{movies.length}</span> {t('search.resultsFor', 'results for')} <span className="font-semibold text-foreground">"{query}"</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {!query && !loading && (
        <div className="flex items-center justify-center animate-slide-in-up">
          <EmptyState
            icon={SearchIcon}
            title={t('search.emptyTitle', 'Search for Movies')}
            description={t('search.emptyDescription', 'Enter a search query to discover amazing movies')}
            illustration="search"
          />
        </div>
      )}

      {query && !loading && movies.length === 0 && (
        <div className="flex items-center justify-center animate-slide-in-up">
          <EmptyState
            icon={Film}
            title={t('search.noResults', 'No Results Found')}
            description={t('search.noResultsDescription', { query })}
            actionLabel={t('search.browseMovies', 'Browse Movies')}
            actionHref="/browse"
            illustration="search"
          />
        </div>
      )}

      {movies.length > 0 && (
        <div className="animate-slide-in-up">
          <MovieGrid movies={movies} loading={loading} />
        </div>
      )}
    </div>
  );
}
