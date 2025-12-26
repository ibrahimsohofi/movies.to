import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, TrendingUp, Heart, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { api } from '@/services/api';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import EmptyState from '@/components/common/EmptyState';
import MovieCard from '@/components/movie/MovieCard';
import MetaTags from '@/components/common/MetaTags';

export default function Recommendations() {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('personalized');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recommendations');
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error(t('recommendations.failedToLoad', 'Failed to load recommendations'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/recommendations/refresh');
      setRecommendations(response.data.recommendations || []);
      toast.success(t('recommendations.refreshed', 'Recommendations refreshed!'));
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      toast.error(t('recommendations.failedToRefresh', 'Failed to refresh recommendations'));
    } finally {
      setRefreshing(false);
    }
  };

  const getReasonIcon = (reason) => {
    if (reason?.includes('rating')) return <Star className="h-3 w-3" />;
    if (reason?.includes('genre')) return <Heart className="h-3 w-3" />;
    if (reason?.includes('trending')) return <TrendingUp className="h-3 w-3" />;
    return <Sparkles className="h-3 w-3" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <MetaTags
        title={`${t('recommendations.title')} - Movies.to`}
        description={t('recommendations.subtitle')}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="h-10 w-10 text-yellow-500" />
            {t('recommendations.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('recommendations.subtitle')}
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('recommendations.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <div className="flex items-start gap-4">
          <Sparkles className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-2">How We Recommend</h3>
            <p className="text-sm text-muted-foreground">
              Our recommendation engine analyzes your ratings, watchlist, and viewing preferences
              to suggest movies you'll love. The more you interact with the platform, the better
              your recommendations become!
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="personalized" className="gap-2">
            <Sparkles className="h-4 w-4" />
            For You
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending Now
          </TabsTrigger>
          <TabsTrigger value="similar" className="gap-2">
            <Heart className="h-4 w-4" />
            Similar to Liked
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <LoadingIndicator />
          ) : recommendations.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No recommendations yet"
              description="Start rating movies and adding them to your watchlist to get personalized recommendations"
              action={
                <Link to="/browse">
                  <Button>Browse Movies</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-8">
              {/* Recommendation Sections */}
              {Object.entries(
                recommendations.reduce((acc, movie) => {
                  const category = movie.reason || 'Recommended';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(movie);
                  return acc;
                }, {})
              ).map(([category, movies]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-2xl font-bold">{category}</h2>
                    <Badge variant="outline" className="gap-1">
                      {getReasonIcon(category)}
                      {movies.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {movies.map((movie) => (
                      <div key={movie.id} className="space-y-2">
                        <MovieCard movie={movie} />
                        {movie.score && (
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Sparkles className="h-3 w-3" />
                            <span>{Math.round(movie.score * 100)}% match</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tips */}
      {recommendations.length > 0 && (
        <Card className="p-6 mt-8">
          <h3 className="font-semibold mb-3">💡 Tips for Better Recommendations</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Rate more movies to help us understand your taste</li>
            <li>• Add movies to your watchlist that interest you</li>
            <li>• Create lists to organize movies by genre or theme</li>
            <li>• Follow users with similar taste to discover new content</li>
          </ul>
        </Card>
      )}
    </div>
  );
}
