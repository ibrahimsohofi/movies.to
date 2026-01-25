import { Link } from 'react-router-dom';
import { Eye, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRecentlyViewedStore } from '@/store/useStore';
import { getImageUrl } from '@/services/tmdb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MovieCard from './MovieCard';

export default function RecentlyViewed() {
  const { t } = useTranslation();
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewedStore();

  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-red-600" />
            <h2 className="text-3xl font-bold">{t('common.recentlyViewed')}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearRecentlyViewed}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {t('common.clear')} History
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {recentlyViewed.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    </section>
  );
}
