import { useTranslation } from 'react-i18next';
import MovieCard from './MovieCard';
import MovieGridSkeleton from './MovieGridSkeleton';

export default function MovieGrid({ movies, title, loading = false }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="space-y-6">
        {title && <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>}
        <MovieGridSkeleton count={12} />
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="space-y-4">
        {title && <h2 className="text-2xl font-bold">{title}</h2>}
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('common.noMoviesFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
