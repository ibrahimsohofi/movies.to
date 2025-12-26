import { useState, useEffect } from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { tmdbAPI } from '@/services/tmdb';

const RUNTIME_OPTIONS = [
  { label: 'Any', value: null },
  { label: 'Short (< 90 min)', value: '0-90' },
  { label: 'Medium (90-120 min)', value: '90-120' },
  { label: 'Long (120-180 min)', value: '120-180' },
  { label: 'Epic (180+ min)', value: '180-500' },
];

const SORT_OPTIONS = [
  { label: 'Popularity (High to Low)', value: 'popularity.desc' },
  { label: 'Popularity (Low to High)', value: 'popularity.asc' },
  { label: 'Rating (High to Low)', value: 'vote_average.desc' },
  { label: 'Rating (Low to High)', value: 'vote_average.asc' },
  { label: 'Release Date (Newest)', value: 'release_date.desc' },
  { label: 'Release Date (Oldest)', value: 'release_date.asc' },
  { label: 'Title (A-Z)', value: 'title.asc' },
  { label: 'Title (Z-A)', value: 'title.desc' },
];

export default function FilterPanel({ filters, onFilterChange, onClearFilters }) {
  const [isOpen, setIsOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await tmdbAPI.getGenres();
        setGenres(response.genres || []);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }
    };
    fetchGenres();
  }, []);

  const handleYearChange = (value) => {
    onFilterChange({ yearRange: value });
  };

  const handleRatingChange = (value) => {
    onFilterChange({ ratingRange: value });
  };

  const handleRuntimeChange = (value) => {
    onFilterChange({ runtime: value });
  };

  const handleSortChange = (value) => {
    onFilterChange({ sortBy: value });
  };

  const handleGenreToggle = (genreId) => {
    const currentGenres = filters.genres || [];
    const newGenres = currentGenres.includes(genreId)
      ? currentGenres.filter((id) => id !== genreId)
      : [...currentGenres, genreId];
    onFilterChange({ genres: newGenres });
  };

  const hasActiveFilters = () => {
    return (
      (filters.genres && filters.genres.length > 0) ||
      (filters.runtime && filters.runtime !== null) ||
      (filters.yearRange && (filters.yearRange[0] !== 1900 || filters.yearRange[1] !== currentYear)) ||
      (filters.ratingRange && (filters.ratingRange[0] !== 0 || filters.ratingRange[1] !== 10))
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.genres && filters.genres.length > 0) count += filters.genres.length;
    if (filters.runtime && filters.runtime !== null) count++;
    if (filters.yearRange && (filters.yearRange[0] !== 1900 || filters.yearRange[1] !== currentYear)) count++;
    if (filters.ratingRange && (filters.ratingRange[0] !== 0 || filters.ratingRange[1] !== 10)) count++;
    return count;
  };

  return (
    <div className="w-full">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant={isOpen ? 'default' : 'outline'}
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Advanced Filters
          {hasActiveFilters() && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 min-w-[1.25rem]">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>

        {hasActiveFilters() && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="p-6 mb-6 space-y-6 animate-in slide-in-from-top-5">
          {/* Sort By */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Sort By</Label>
            <Select value={filters.sortBy || 'popularity.desc'} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Release Year</Label>
              <span className="text-sm text-muted-foreground">
                {filters.yearRange?.[0] || 1900} - {filters.yearRange?.[1] || currentYear}
              </span>
            </div>
            <Slider
              value={filters.yearRange || [1900, currentYear]}
              onValueChange={handleYearChange}
              min={1900}
              max={currentYear}
              step={1}
              className="w-full"
            />
          </div>

          {/* Rating Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Rating</Label>
              <span className="text-sm text-muted-foreground">
                {filters.ratingRange?.[0] || 0} - {filters.ratingRange?.[1] || 10} ★
              </span>
            </div>
            <Slider
              value={filters.ratingRange || [0, 10]}
              onValueChange={handleRatingChange}
              min={0}
              max={10}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Runtime */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Runtime</Label>
            <Select value={filters.runtime || 'null'} onValueChange={handleRuntimeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select runtime..." />
              </SelectTrigger>
              <SelectContent>
                {RUNTIME_OPTIONS.map((option) => (
                  <SelectItem key={option.label} value={option.value === null ? 'null' : option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Genres */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Genres</Label>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreToggle(genre.id)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    filters.genres?.includes(genre.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-accent border-input'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Active Filters</Label>
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.genres?.map((genreId) => {
                  const genre = genres.find((g) => g.id === genreId);
                  return (
                    <Badge key={genreId} variant="secondary" className="gap-1">
                      {genre?.name}
                      <button
                        onClick={() => handleGenreToggle(genreId)}
                        className="ml-1 hover:bg-background/50 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
                {filters.runtime && filters.runtime !== 'null' && (
                  <Badge variant="secondary" className="gap-1">
                    {RUNTIME_OPTIONS.find((o) => o.value === filters.runtime)?.label}
                    <button
                      onClick={() => handleRuntimeChange('null')}
                      className="ml-1 hover:bg-background/50 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
