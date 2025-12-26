import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, Star, Languages, SlidersHorizontal, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { tmdbAPI } from '@/services/tmdb';
import { toast } from 'sonner';

export default function AdvancedSearchBar({ onSearch, onFilterChange, compact = false }) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [filters, setFilters] = useState({
    year: '',
    rating: [0],
    sortBy: 'popularity.desc',
    language: 'en',
  });

  useEffect(() => {
    // Fetch genres
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

  const handleSearch = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      onSearch?.(query, { ...filters, genres: selectedGenres });
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const clearFilters = () => {
    setFilters({
      year: '',
      rating: [0],
      sortBy: 'popularity.desc',
      language: 'en',
    });
    setSelectedGenres([]);
    setQuery('');
    toast.success(t('toasts.filtersCleared'));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const activeFiltersCount =
    (selectedGenres.length > 0 ? 1 : 0) +
    (filters.year ? 1 : 0) +
    (filters.rating[0] > 0 ? 1 : 0) +
    (filters.language !== 'en' ? 1 : 0);

  if (compact) {
    return (
      <div className="flex gap-2 w-full max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="search"
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            className="pl-10 pr-4 h-12 text-base"
          />
        </div>
        <Button onClick={handleSearch} size="lg" className="h-12">
          Search
        </Button>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          size="lg"
          className="h-12 relative"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="search"
            placeholder="Search for movies, actors, directors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            className="pl-10 pr-4 h-14 text-lg"
          />
        </div>
        <Button onClick={handleSearch} size="lg" className="h-14 px-8">
          <Search className="h-5 w-5 mr-2" />
          Search
        </Button>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? "default" : "outline"}
          size="lg"
          className="h-14 px-6 relative"
        >
          <Filter className="h-5 w-5 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="border-2">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Advanced Filters
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>

            {/* Genres */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Film className="h-4 w-4" />
                Genres
              </Label>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <Badge
                    key={genre.id}
                    variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform px-3 py-1.5"
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Year Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Release Year
                </Label>
                <Select value={filters.year} onValueChange={(value) => handleFilterChange('year', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Any year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any year</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Sort By
                </Label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity.desc">Most Popular</SelectItem>
                    <SelectItem value="popularity.asc">Least Popular</SelectItem>
                    <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                    <SelectItem value="vote_average.asc">Lowest Rated</SelectItem>
                    <SelectItem value="release_date.desc">Newest First</SelectItem>
                    <SelectItem value="release_date.asc">Oldest First</SelectItem>
                    <SelectItem value="title.asc">A-Z</SelectItem>
                    <SelectItem value="title.desc">Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Language
                </Label>
                <Select value={filters.language} onValueChange={(value) => handleFilterChange('language', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="">All Languages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rating Slider */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  Minimum Rating
                </span>
                <span className="text-primary">{filters.rating[0].toFixed(1)}+</span>
              </Label>
              <Slider
                value={filters.rating}
                onValueChange={(value) => handleFilterChange('rating', value)}
                max={10}
                step={0.5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.0</span>
                <span>5.0</span>
                <span>10.0</span>
              </div>
            </div>

            {/* Apply Button */}
            <Button onClick={handleSearch} className="w-full h-12 text-base" size="lg">
              <Search className="h-5 w-5 mr-2" />
              Apply Filters & Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
