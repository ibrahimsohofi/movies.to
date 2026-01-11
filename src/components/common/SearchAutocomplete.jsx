import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Film, TrendingUp, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tmdbAPI, getImageUrl } from '@/services/tmdb';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SearchAutocomplete({ variant = 'default' }) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  // Detect text direction (RTL for Arabic, LTR for others)
  const isRTL = i18n.language === 'ar';

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

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Keyboard navigation for search dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle arrow keys and enter in dropdown
      if (isOpen && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
          setIsOpen(false);
          setIsExpanded(false);
          inputRef.current?.blur();
        }
      } else if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, suggestions, selectedIndex, isExpanded]);

  // Close dropdown and collapse when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        if (!query.trim()) {
          setIsExpanded(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

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
      setIsExpanded(false);
    }
  };

  const handleSuggestionClick = (movie) => {
    saveToRecentSearches(movie.title);
    navigate(`/movie/${movie.id}`);
    setQuery('');
    setIsOpen(false);
    setIsExpanded(false);
    setSelectedIndex(-1);
  };

  const handleRecentSearchClick = (search) => {
    setQuery(search);
    navigate(`/search?q=${encodeURIComponent(search)}`);
    setIsOpen(false);
    setIsExpanded(false);
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

  const handleSearchIconClick = () => {
    setIsExpanded(true);
  };

  const handleCloseSearch = () => {
    setIsExpanded(false);
    setQuery('');
    setIsOpen(false);
  };

  // For mobile menu, show full search bar directly
  if (variant === 'mobile') {
    return (
      <div ref={wrapperRef} className="relative w-full">
        <form onSubmit={handleSubmit}>
          <div className="relative group">
            <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-300 group-hover:text-red-600 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              ref={inputRef}
              type="text"
              placeholder={t('common.searchMovies')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              className={`bg-muted/50 border-border/50 focus:bg-background focus:border-red-600/50 focus:ring-red-600/20 transition-all duration-300 hover:bg-muted/70 ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
            />
          </div>
        </form>

        {/* Mobile Dropdown */}
        {isOpen && (
          <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto shadow-2xl border-red-500/20 backdrop-blur-sm bg-background/95 animate-in fade-in slide-in-from-top-2 duration-200">
            {loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t('common.loading')}
              </div>
            )}

            {!loading && query && suggestions.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t('common.noResults')}
              </div>
            )}

            {!loading && query && suggestions.length > 0 && (
              <div className="p-2">
                {suggestions.map((movie, index) => (
                  <button
                    key={movie.id}
                    onClick={() => handleSuggestionClick(movie)}
                    className={`w-full flex items-center gap-3 p-2 hover:bg-muted rounded-md transition-colors ${isRTL ? 'text-right flex-row-reverse' : 'text-left'} ${selectedIndex === index ? 'bg-red-50 dark:bg-red-950/30' : ''}`}
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
                          <span className={isRTL ? 'mr-2' : 'ml-2'}>
                            {movie.vote_average.toFixed(1)}
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!query && recentSearches.length > 0 && (
              <div className="p-2">
                <div className={`flex items-center justify-between px-2 py-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`text-xs font-semibold text-muted-foreground flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <TrendingUp className="h-3 w-3" />
                    {t('common.recentSearches')}
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-red-600"
                  >
                    {t('common.clear')}
                  </button>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className={`w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors text-sm ${isRTL ? 'text-right flex-row-reverse' : 'text-left'}`}
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

  // Desktop: Expandable search icon
  return (
    <div ref={wrapperRef} className="relative h-10 overflow-visible">
      <div className={`flex items-center h-full ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Search Icon Button (visible when collapsed) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSearchIconClick}
          className={`rounded-full hover:bg-muted/80 transition-all duration-300 hover:scale-110 flex-shrink-0 ${isExpanded ? 'opacity-0 w-0 p-0 overflow-hidden pointer-events-none' : 'opacity-100 w-10'}`}
          aria-label={t('nav.search')}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Expandable Search Input */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-out h-10 flex items-center
            ${isExpanded
              ? 'w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 2xl:w-96 opacity-100'
              : 'w-0 opacity-0'
            }
          `}
        >
          <form onSubmit={handleSubmit} className="relative w-full h-full flex items-center">
            <div className={`relative flex items-center w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Search Icon inside input */}
              <Search
                className={`
                  absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10
                  ${isRTL ? 'right-3' : 'left-3'}
                `}
              />

              <Input
                ref={inputRef}
                type="text"
                placeholder={t('common.searchMovies')}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setIsOpen(true)}
                className={`
                  bg-muted/50 border-border/50 h-9
                  focus:bg-background focus:border-red-600/50 focus:ring-red-600/20
                  transition-all duration-300 hover:bg-muted/70
                  ${isRTL
                    ? 'pr-10 pl-10 text-right'
                    : 'pl-10 pr-10 text-left'
                  }
                `}
                dir={isRTL ? 'rtl' : 'ltr'}
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseSearch}
                className={`
                  absolute top-1/2 transform -translate-y-1/2
                  p-1 rounded-full hover:bg-muted transition-colors z-10
                  ${isRTL ? 'left-2' : 'right-2'}
                `}
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Enhanced Dropdown */}
      {isOpen && isExpanded && (
        <Card
          className={`
            absolute top-full mt-2 w-64 lg:w-80 z-50 max-h-96 overflow-y-auto
            shadow-2xl border-red-500/20 backdrop-blur-sm bg-background/95
            animate-in fade-in slide-in-from-top-2 duration-200
            ${isRTL ? 'right-0' : 'left-0'}
          `}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          )}

          {!loading && query && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('common.noResults')}
            </div>
          )}

          {!loading && query && suggestions.length > 0 && (
            <div className="p-2">
              <div className={`text-xs font-semibold text-muted-foreground px-2 py-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('search.results')}
              </div>
              {suggestions.map((movie, index) => (
                <button
                  key={movie.id}
                  onClick={() => handleSuggestionClick(movie)}
                  className={`
                    w-full flex items-center gap-3 p-2 hover:bg-muted rounded-md transition-colors
                    ${isRTL ? 'text-right flex-row-reverse' : 'text-left'}
                    ${selectedIndex === index ? 'bg-red-50 dark:bg-red-950/30 border-red-500/50' : ''}
                  `}
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
                        <span className={isRTL ? 'mr-2' : 'ml-2'}>
                          {movie.vote_average.toFixed(1)}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              ))}
              <button
                onClick={handleSubmit}
                className={`
                  w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors
                  text-sm text-red-600 font-medium mt-1
                  ${isRTL ? 'flex-row-reverse' : ''}
                `}
              >
                <Search className="h-4 w-4" />
                {t('common.viewAllResults', { query })}
              </button>
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className={`flex items-center justify-between px-2 py-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`text-xs font-semibold text-muted-foreground flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <TrendingUp className="h-3 w-3" />
                  {t('common.recentSearches')}
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-red-600"
                >
                  {t('common.clear')}
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className={`
                    w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors text-sm
                    ${isRTL ? 'text-right flex-row-reverse' : 'text-left'}
                  `}
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
