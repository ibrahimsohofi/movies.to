import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tmdbAPI } from '@/services/tmdb';
import MovieGrid from '@/components/movie/MovieGrid';
import MovieGridSkeleton from '@/components/movie/MovieGridSkeleton';
import { Button } from '@/components/ui/button';

export default function Genre() {
  const { t } = useTranslation();
  const { genreId } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [genreName, setGenreName] = useState('');

  const genres = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western'
  };

  useEffect(() => {
    setGenreName(genres[genreId] || 'Genre');
    fetchMovies(1);
  }, [genreId]);

  const fetchMovies = async (pageNum) => {
    try {
      setLoading(true);
      const data = await tmdbAPI.getMoviesByGenre(genreId, pageNum);
      setMovies(data.results || []);
      setTotalPages(data.total_pages || 1);
      setPage(pageNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error fetching genre movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      fetchMovies(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      fetchMovies(page + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('genre.title', { genre: genreName })}</h1>
          <p className="text-muted-foreground">
            {t('genre.description', { genre: genreName.toLowerCase() })}
          </p>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <MovieGridSkeleton count={18} />
        ) : (
          <>
            <MovieGrid movies={movies} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <Button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  variant="outline"
                >
                  {t('common.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('common.page')} {page} {t('common.of')} {totalPages}
                </span>
                <Button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  variant="outline"
                >
                  {t('common.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
