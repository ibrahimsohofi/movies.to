import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { tmdbAPI, getImageUrl } from '@/services/tmdb';

export default function MovieSelector({ onAddMovie, maxMovies, currentMoviesCount }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

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

  const handleAddMovie = (movie) => {
    onAddMovie(movie);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <Card className="p-6 mb-8">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a movie to compare..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-10"
            disabled={currentMoviesCount >= maxMovies}
          />
        </div>

        {searchQuery && currentMoviesCount >= maxMovies && (
          <p className="text-sm text-muted-foreground">
            Maximum {maxMovies} movies can be compared at once. Remove a movie to add more.
          </p>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((movie) => (
              <button
                key={movie.id}
                onClick={() => handleAddMovie(movie)}
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

        {searching && (
          <p className="text-sm text-muted-foreground text-center">Searching...</p>
        )}
      </div>
    </Card>
  );
}
