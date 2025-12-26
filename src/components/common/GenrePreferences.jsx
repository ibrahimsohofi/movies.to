import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

export default function GenrePreferences({ preferences = [] }) {
  if (!preferences || preferences.length === 0) {
    return (
      <Card className="p-8 bg-gray-800/50 border-gray-700 text-center">
        <p className="text-gray-400">No genre preferences yet. Watch and rate movies to see your preferences!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {preferences.map((pref, index) => {
        const percentage = Math.min(pref.preference_score, 100);
        const avgRating = pref.rating_count > 0
          ? (pref.rating_sum / pref.rating_count).toFixed(1)
          : 0;

        return (
          <Card key={pref.genre_id} className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Link
                  to={`/genre/${pref.slug}`}
                  className="text-white font-medium hover:text-red-400 transition-colors"
                >
                  #{index + 1} {pref.name}
                </Link>
                <p className="text-sm text-gray-400 mt-1">
                  {pref.view_count} {pref.view_count === 1 ? 'movie' : 'movies'} watched
                  {avgRating > 0 && ` • Avg rating: ${avgRating}/10`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{percentage.toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Preference</p>
              </div>
            </div>
            <Progress value={percentage} className="h-2" />
          </Card>
        );
      })}
    </div>
  );
}
