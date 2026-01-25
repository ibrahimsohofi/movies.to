import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, TrendingUp, Heart, Star, Award, Brain, Lightbulb, Info, ChevronRight, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useUserRatingsStore, useWatchlistStore, useRecentlyViewedStore } from '@/store/useStore';
import { tmdbAPI } from '@/services/tmdb';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import EmptyState from '@/components/common/EmptyState';
import MovieCard from '@/components/movie/MovieCard';
import BecauseYouRated from '@/components/movie/BecauseYouRated';
import MoodSelector from '@/components/movie/MoodSelector';
import MetaTags from '@/components/common/MetaTags';
import AIRecommendations from '@/components/recommendations/AIRecommendations';
import { cn } from '@/lib/utils';

// Recommendation Explanation Card Component
function RecommendationCard({ movie, explanation, score, algorithms, confidence }) {
  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return 'text-green-500';
    if (conf >= 0.6) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getAlgorithmBadge = (algo) => {
    const colors = {
      content_based: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      because_watched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      trending: 'bg-red-500/20 text-red-400 border-red-500/30',
      mood: 'bg-green-500/20 text-green-400 border-green-500/30',
      hybrid: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-400 border-pink-500/30',
    };
    const labels = {
      content_based: 'Your Taste',
      because_watched: 'Similar',
      trending: 'Trending',
      mood: 'Mood Match',
      hybrid: 'AI Pick',
    };
    return (
      <Badge variant="outline" className={cn('text-xs', colors[algo] || 'bg-gray-500/20')}>
        {labels[algo] || algo}
      </Badge>
    );
  };

  return (
    <div className="relative group">
      <MovieCard movie={movie} />
      {/* Explanation Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {explanation && (
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="h-3 w-3 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-200 line-clamp-2">{explanation}</p>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {algorithms?.slice(0, 2).map((algo) => (
                <span key={algo}>{getAlgorithmBadge(algo)}</span>
              ))}
            </div>
            {confidence && (
              <span className={cn('text-xs font-medium', getConfidenceColor(confidence))}>
                {Math.round(confidence * 100)}% match
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mood-Based Recommendations Section
function MoodRecommendations({ mood, movies, loading }) {
  if (!mood) return null;

  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Movies for Your Mood
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (movies.length === 0) return null;

  return (
    <Card className="mb-8 border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Perfect for when you're feeling {mood}
            </CardTitle>
            <CardDescription>
              AI-curated movies based on your current mood
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            {movies.length} picks
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.slice(0, 12).map((movie) => (
            <RecommendationCard
              key={movie.id}
              movie={movie.movie_data || movie}
              explanation={movie.explanation}
              score={movie.score}
              algorithms={['mood']}
              confidence={movie.confidence}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Recommendations() {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('personalized');
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodRecommendations, setMoodRecommendations] = useState([]);
  const [moodLoading, setMoodLoading] = useState(false);

  const { getAllRatings, getFavoriteGenres, getHighlyRatedMovies, getStats } = useUserRatingsStore();
  const { watchlist } = useWatchlistStore();
  const { recentlyViewed } = useRecentlyViewedStore();

  const allRatings = getAllRatings();
  const highlyRated = getHighlyRatedMovies(4);
  const favoriteGenres = getFavoriteGenres();
  const stats = getStats();

  // Get top 3 highly rated movies to show "Because you rated" sections
  const topRatedMovies = useMemo(() => {
    return allRatings
      .filter(r => r.rating >= 4)
      .slice(0, 3);
  }, [allRatings]);

  // Get all movie IDs to exclude from recommendations
  const excludeIds = useMemo(() => {
    const ids = new Set();
    allRatings.forEach(r => ids.add(r.movie.id));
    watchlist.forEach(m => ids.add(m.id));
    recentlyViewed.forEach(m => ids.add(m.id));
    return ids;
  }, [allRatings, watchlist, recentlyViewed]);

  useEffect(() => {
    fetchRecommendations();
  }, [highlyRated, watchlist, favoriteGenres]);

  // Fetch mood-based recommendations when mood changes
  useEffect(() => {
    if (selectedMood) {
      fetchMoodRecommendations(selectedMood);
    } else {
      setMoodRecommendations([]);
    }
  }, [selectedMood]);

  const fetchMoodRecommendations = async (mood) => {
    setMoodLoading(true);
    try {
      // Use TMDB discover with mood-mapped genres
      const moodGenreMap = {
        happy: [35, 10751, 16],
        sad: [18, 10749],
        excited: [28, 12, 878],
        scared: [27, 53],
        relaxed: [99, 36, 10402],
        romantic: [10749, 35],
        adventurous: [12, 14, 878],
        nostalgic: [10751, 16, 35],
        thoughtful: [18, 9648, 99],
        energetic: [28, 80, 53],
      };

      const genres = moodGenreMap[mood] || [];
      if (genres.length > 0) {
        const response = await tmdbAPI.getMoviesByMultipleGenres(genres, 1, 'popularity.desc');
        const filtered = (response?.results || [])
          .filter(m => !excludeIds.has(m.id))
          .map(movie => ({
            ...movie,
            movie_data: movie,
            explanation: `Perfect for when you're feeling ${mood}`,
            confidence: 0.75 + Math.random() * 0.2,
            score: movie.vote_average / 10,
          }));
        setMoodRecommendations(filtered);
      }
    } catch (error) {
      console.error('Error fetching mood recommendations:', error);
    } finally {
      setMoodLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const allRecs = [];

      // Get recommendations from highly rated movies
      const sourceMovies = highlyRated.length > 0
        ? highlyRated.slice(0, 3)
        : watchlist.slice(0, 3);

      const recPromises = sourceMovies.map(movie =>
        tmdbAPI.getRecommendations(movie.id, 1).catch(() => ({ results: [] }))
      );

      const recResults = await Promise.all(recPromises);
      recResults.forEach((res, idx) => {
        if (res?.results) {
          res.results.forEach(movie => {
            allRecs.push({
              ...movie,
              explanation: `Because you liked "${sourceMovies[idx]?.title}"`,
              algorithms: ['because_watched'],
              confidence: 0.8 + Math.random() * 0.15,
            });
          });
        }
      });

      // Also get movies from favorite genres
      if (favoriteGenres.length > 0) {
        const topGenreIds = favoriteGenres.slice(0, 2).map(g => g.genreId);
        const genreMovies = await tmdbAPI.getMoviesByMultipleGenres(topGenreIds, 1, 'vote_average.desc');
        if (genreMovies?.results) {
          genreMovies.results.forEach(movie => {
            allRecs.push({
              ...movie,
              explanation: 'Matches your favorite genres',
              algorithms: ['content_based'],
              confidence: 0.7 + Math.random() * 0.2,
            });
          });
        }
      }

      // Deduplicate and filter out already seen/rated movies
      const uniqueRecs = [];
      const seenIds = new Set();

      for (const movie of allRecs) {
        if (!seenIds.has(movie.id) && !excludeIds.has(movie.id)) {
          seenIds.add(movie.id);
          uniqueRecs.push(movie);
        }
      }

      // Sort by vote average
      uniqueRecs.sort((a, b) => b.vote_average - a.vote_average);
      setRecommendations(uniqueRecs);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error(t('recommendations.failedToLoad', 'Failed to load recommendations'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecommendations();
    if (selectedMood) {
      await fetchMoodRecommendations(selectedMood);
    }
    toast.success(t('recommendations.refreshed', 'Recommendations refreshed!'));
    setRefreshing(false);
  };

  const handleMoodChange = (mood) => {
    setSelectedMood(mood);
    if (mood) {
      toast.success(`Finding movies for your ${mood} mood...`);
    }
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

      {/* Mood Selector Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                How are you feeling today?
              </CardTitle>
              <CardDescription>
                Select your mood and we'll find the perfect movies for you
              </CardDescription>
            </div>
            {selectedMood && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMood(null)}
              >
                Clear mood
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MoodSelector
            selectedMood={selectedMood}
            onMoodChange={handleMoodChange}
            variant="cards"
            showDescriptions={true}
          />
        </CardContent>
      </Card>

      {/* Mood-Based Recommendations */}
      <MoodRecommendations
        mood={selectedMood}
        movies={moodRecommendations}
        loading={moodLoading}
      />

      {/* Stats Card */}
      {stats.totalRatings > 0 && (
        <Card className="p-6 mb-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Your Taste Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Based on {stats.totalRatings} ratings - Average rating: {stats.averageRating.toFixed(1)} stars
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{stats.totalRatings}</div>
                <div className="text-xs text-muted-foreground">Rated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{watchlist.length}</div>
                <div className="text-xs text-muted-foreground">Watchlist</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">{Object.values(stats.distribution)[4] || 0}</div>
                <div className="text-xs text-muted-foreground">5 Stars</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="ai-powered" className="gap-2">
            <Zap className="h-4 w-4" />
            AI Powered
          </TabsTrigger>
          <TabsTrigger value="personalized" className="gap-2">
            <Sparkles className="h-4 w-4" />
            For You
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="similar" className="gap-2">
            <Heart className="h-4 w-4" />
            Similar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-powered" className="mt-6">
          <AIRecommendations showProfile={true} showAlgorithmSelector={true} limit={18} />
        </TabsContent>

        <TabsContent value="personalized" className="mt-6">
          {loading ? (
            <LoadingIndicator />
          ) : allRatings.length === 0 && watchlist.length === 0 ? (
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
            <div className="space-y-12">
              {/* Because You Rated Sections */}
              {topRatedMovies.map((ratingData) => (
                <BecauseYouRated
                  key={ratingData.movie.id}
                  movie={ratingData.movie}
                  rating={ratingData.rating}
                />
              ))}

              {/* General Recommendations with Explanations */}
              {recommendations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Award className="h-6 w-6 text-yellow-500" />
                    <h2 className="text-2xl font-bold">AI-Powered Picks</h2>
                    <Badge variant="outline" className="gap-1">
                      <Info className="h-3 w-3" />
                      Hover for explanations
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {recommendations.slice(0, 18).map((movie) => (
                      <RecommendationCard
                        key={movie.id}
                        movie={movie}
                        explanation={movie.explanation}
                        algorithms={movie.algorithms}
                        confidence={movie.confidence}
                        score={movie.score}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <p className="text-muted-foreground mb-6">Discover what's popular right now</p>
          {loading ? (
            <LoadingIndicator />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {recommendations.filter(m => m.popularity > 100).slice(0, 18).map((movie) => (
                <RecommendationCard
                  key={movie.id}
                  movie={movie}
                  explanation="Trending right now"
                  algorithms={['trending']}
                  confidence={0.9}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="similar" className="mt-6">
          <p className="text-muted-foreground mb-6">Movies similar to ones you've rated highly</p>
          {loading ? (
            <LoadingIndicator />
          ) : highlyRated.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No highly rated movies yet"
              description="Rate some movies 4 stars or higher to see similar recommendations"
              action={
                <Link to="/browse">
                  <Button>Browse Movies</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {recommendations.slice(0, 18).map((movie) => (
                <RecommendationCard
                  key={movie.id}
                  movie={movie}
                  explanation={movie.explanation}
                  algorithms={movie.algorithms}
                  confidence={movie.confidence}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tips */}
      {recommendations.length > 0 && (
        <Card className="p-6 mt-8">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Tips for Better Recommendations
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-purple-500" />
              Rate more movies to help us understand your taste
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-purple-500" />
              Try different moods to discover new genres
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-purple-500" />
              Add movies to your watchlist that interest you
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-purple-500" />
              Follow users with similar taste to discover new content
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
}
