import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tmdbAPI, getImageUrl } from '@/services/tmdb';
import { Film, TrendingUp, Star, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MovieGrid from '@/components/movie/MovieGrid';

export default function Genres() {
  const { t } = useTranslation();
  const [genres, setGenres] = useState([]);
  const [genreMovies, setGenreMovies] = useState({});
  const [genreBackgrounds, setGenreBackgrounds] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const navigate = useNavigate();

  // Helper function to get translated genre name
  const getTranslatedGenreName = (genreName) => {
    const translationKey = `genres.names.${genreName}`;
    const translated = t(translationKey);
    // If translation doesn't exist, return original name
    return translated === translationKey ? genreName : translated;
  };

  // Popular genre IDs for featured carousels
  const featuredGenres = [
    { id: 28, name: 'Action', color: 'from-red-600 to-orange-600' },
    { id: 35, name: 'Comedy', color: 'from-yellow-600 to-orange-600' },
    { id: 18, name: 'Drama', color: 'from-blue-600 to-purple-600' },
    { id: 27, name: 'Horror', color: 'from-purple-600 to-red-600' },
    { id: 878, name: 'Science Fiction', color: 'from-cyan-600 to-blue-600' },
    { id: 10749, name: 'Romance', color: 'from-pink-600 to-red-600' },
    { id: 53, name: 'Thriller', color: 'from-gray-600 to-red-600' },
    { id: 16, name: 'Animation', color: 'from-green-600 to-teal-600' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all genres
        const genresResponse = await tmdbAPI.getGenres();
        const allGenres = genresResponse.genres || [];
        setGenres(allGenres);

        // Fetch background images for all genres
        const backgroundPromises = allGenres.map(async (genre) => {
          try {
            const response = await tmdbAPI.getMoviesByGenre(genre.id, 1);
            const topMovie = response.results?.[0];
            return {
              genreId: genre.id,
              backdrop: topMovie?.backdrop_path || topMovie?.poster_path || null
            };
          } catch (error) {
            console.error(`Error fetching background for genre ${genre.name}:`, error);
            return { genreId: genre.id, backdrop: null };
          }
        });

        // Fetch movies for featured genres
        const moviePromises = featuredGenres.map(async (genre) => {
          try {
            const response = await tmdbAPI.getMoviesByGenre(genre.id, 1);
            return { genreId: genre.id, movies: response.results?.slice(0, 10) || [] };
          } catch (error) {
            console.error(`Error fetching movies for genre ${genre.name}:`, error);
            return { genreId: genre.id, movies: [] };
          }
        });

        const [backgroundResults, movieResults] = await Promise.all([
          Promise.all(backgroundPromises),
          Promise.all(moviePromises)
        ]);

        // Process backgrounds
        const backgroundsMap = {};
        backgroundResults.forEach(({ genreId, backdrop }) => {
          backgroundsMap[genreId] = backdrop;
        });
        setGenreBackgrounds(backgroundsMap);

        // Process movies
        const moviesMap = {};
        movieResults.forEach(({ genreId, movies }) => {
          moviesMap[genreId] = movies;
        });
        setGenreMovies(moviesMap);
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGenreClick = (genreId) => {
    navigate(`/genre/${genreId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="inline-block h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-muted-foreground">{t('genres.loadingGenres')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      {/* Header */}
      <div className="mb-12 animate-slide-in-up">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="h-8 w-8 text-red-600 animate-pulse-slow" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
            {t('genres.title')}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          {t('genres.description')}
        </p>
      </div>

      {/* All Genres Grid */}
      <div className="mb-16 animate-slide-in-up">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Film className="h-6 w-6 text-red-600" />
          {t('genres.allGenres')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {genres.map((genre) => {
            const backgroundImage = genreBackgrounds[genre.id];
            const imageUrl = backgroundImage ? getImageUrl(backgroundImage, 'w500') : null;

            return (
              <Card
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                className="cursor-pointer group hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 hover:-translate-y-2 hover:scale-105 border-border/50 hover:border-red-500/50 overflow-hidden relative h-32"
              >
                {/* Background Image */}
                {imageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                    }}
                  />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 group-hover:from-black/90 group-hover:via-black/80 transition-all duration-300" />

                {/* Red Accent Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/20 group-hover:to-pink-600/20 transition-all duration-300" />

                <CardContent className="p-4 h-full flex flex-col justify-end items-center text-center relative z-10">
                  <Film className="h-6 w-6 mb-2 text-red-500 group-hover:text-red-400 group-hover:scale-125 transition-all duration-300 drop-shadow-lg" />
                  <h3 className="font-bold text-sm md:text-base text-white group-hover:text-red-400 transition-colors drop-shadow-lg">
                    {getTranslatedGenreName(genre.name)}
                  </h3>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Featured Genre Carousels */}
      <div className="space-y-12">
        {featuredGenres.map((genre) => {
          const movies = genreMovies[genre.id] || [];
          if (movies.length === 0) return null;

          return (
            <div key={genre.id} className="animate-slide-in-up">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${genre.color} bg-clip-text text-transparent`}>
                    {getTranslatedGenreName(genre.name)}
                  </h2>
                  <Badge variant="secondary" className="bg-red-600/10 text-red-600">
                    {movies.length} {t('genres.movies')}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleGenreClick(genre.id)}
                  className="group hover:text-red-600 transition-colors"
                >
                  {t('common.viewAll')}
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Horizontal Scrollable Movie Grid */}
              <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-transparent">
                  {movies.map((movie) => (
                    <Card
                      key={movie.id}
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="flex-shrink-0 w-48 cursor-pointer group hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-red-500/50 overflow-hidden"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                        {movie.poster_path ? (
                          <img
                            src={getImageUrl(movie.poster_path, 'w342')}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}

                        {/* Rating Badge */}
                        {movie.vote_average > 0 && (
                          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs font-bold text-white">
                              {movie.vote_average.toFixed(1)}
                            </span>
                          </div>
                        )}

                        {/* Hot Badge */}
                        {movie.vote_average >= 8 && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-gradient-to-r from-red-600 to-pink-600 text-white border-0 animate-pulse-slow">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {t('genres.hot')}
                            </Badge>
                          </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-semibold line-clamp-1 group-hover:text-red-600 transition-colors">
                          {movie.title}
                        </h3>
                        {movie.release_date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(movie.release_date).getFullYear()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
