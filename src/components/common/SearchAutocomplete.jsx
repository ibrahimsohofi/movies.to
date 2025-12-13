import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Film, TrendingUp } from 'lucide-react';
import { tmdbAPI, getImageUrl } from '@/services/tmdb';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      if (query === '') {
        setIsOpen(false);
      }
      return;
    }

    setLoading(true);
    setIsOpen(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debouncing
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await tmdbAPI.searchMovies(query, 1);
        setSuggestions(response.results?.slice(0, 5) || []);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveToRecentSearches(query.trim());
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setQuery('');
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (movie) => {
    saveToRecentSearches(movie.title);
    navigate(`/movie/${movie.id}`);
    setQuery('');
    setIsOpen(false);
  };

  const handleRecentSearchClick = (search) => {
    setQuery(search);
    navigate(`/search?q=${encodeURIComponent(search)}`);
    setIsOpen(false);
  };

  const saveToRecentSearches = (search) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-300" />
          <Input
            type="text"
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-4 bg-muted/50 border-border/50 focus:bg-background focus:border-red-600/50 focus:ring-red-600/20 transition-all duration-300"
          />
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto shadow-lg">
          {loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {!loading && query && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}

          {!loading && query && suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
                Suggestions
              </div>
              {suggestions.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => handleSuggestionClick(movie)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-md transition-colors text-left"
                >
                  <div className="w-10 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                    {movie.poster_path ? (
                      <img
                        src={getImageUrl(movie.poster_path, 'w92')}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{movie.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {movie.release_date?.split('-')[0] || 'N/A'}
                      {movie.vote_average > 0 && (
                        <span className="ml-2">
                          ⭐ {movie.vote_average.toFixed(1)}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              ))}
              <button
                onClick={handleSubmit}
                className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors text-sm text-red-600 font-medium mt-1"
              >
                <Search className="h-4 w-4" />
                View all results for "{query}"
              </button>
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Recent Searches
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-red-600"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors text-left text-sm"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  {search}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
