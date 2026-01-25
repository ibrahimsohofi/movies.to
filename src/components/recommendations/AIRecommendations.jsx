import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  Users,
  TrendingUp,
  Zap,
  Heart,
  RefreshCw,
  Info,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Lightbulb,
  BarChart3,
  Target,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import MovieCard from '@/components/movie/MovieCard';
import aiRecommendationsAPI from '@/services/aiRecommendationsAPI';

// Algorithm configurations with metadata
const ALGORITHMS = {
  hybrid: {
    id: 'hybrid',
    name: 'Smart Mix',
    description: 'AI-powered blend of all recommendation algorithms',
    icon: Wand2,
    color: 'from-purple-500 to-pink-500',
    badgeColor: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
  },
  content_based: {
    id: 'content_based',
    name: 'Your Taste',
    description: 'Based on genres, themes, and movies you love',
    icon: Heart,
    color: 'from-rose-500 to-red-500',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
  collaborative: {
    id: 'collaborative',
    name: 'Similar Users',
    description: 'What people with similar taste are watching',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  trending: {
    id: 'trending',
    name: 'Trending Now',
    description: 'Popular movies with smart decay factor',
    icon: TrendingUp,
    color: 'from-orange-500 to-amber-500',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
};

// Recommendation card with explanation and feedback
function AIRecommendationCard({ movie, explanation, score, algorithm, confidence, onFeedback }) {
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const algorithmConfig = ALGORITHMS[algorithm] || ALGORITHMS.hybrid;

  const handleFeedback = (helpful) => {
    setFeedbackGiven(helpful);
    onFeedback?.(movie.id, helpful);
    toast.success(helpful ? 'Thanks for the feedback!' : 'We\'ll improve your recommendations');
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 0.85) return 'text-green-500';
    if (conf >= 0.7) return 'text-emerald-500';
    if (conf >= 0.5) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className="group relative">
      <MovieCard movie={movie} />

      {/* Overlay with AI insights */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
          {/* Algorithm Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', algorithmConfig.badgeColor)}>
              <algorithmConfig.icon className="h-3 w-3 mr-1" />
              {algorithmConfig.name}
            </Badge>
            {confidence && (
              <span className={cn('text-xs font-medium', getConfidenceColor(confidence))}>
                {Math.round(confidence * 100)}% match
              </span>
            )}
          </div>

          {/* Explanation */}
          {explanation && (
            <div className="flex items-start gap-2">
              <Lightbulb className="h-3 w-3 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-200 line-clamp-2">{explanation}</p>
            </div>
          )}

          {/* Score visualization */}
          {score && (
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-cyan-400" />
              <div className="flex-1">
                <Progress value={score * 100} className="h-1.5" />
              </div>
              <span className="text-xs text-cyan-400">{(score * 10).toFixed(1)}</span>
            </div>
          )}

          {/* Feedback buttons */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 px-2',
                      feedbackGiven === true && 'bg-green-500/20 text-green-400'
                    )}
                    onClick={() => handleFeedback(true)}
                    disabled={feedbackGiven !== null}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Good recommendation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 px-2',
                      feedbackGiven === false && 'bg-red-500/20 text-red-400'
                    )}
                    onClick={() => handleFeedback(false)}
                    disabled={feedbackGiven !== null}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Not for me</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

// Algorithm selector component
function AlgorithmSelector({ selected, onChange }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Object.values(ALGORITHMS).map((algo) => {
        const Icon = algo.icon;
        const isSelected = selected === algo.id;

        return (
          <button
            key={algo.id}
            onClick={() => onChange(algo.id)}
            className={cn(
              'relative p-4 rounded-xl border transition-all duration-200',
              'hover:scale-[1.02] hover:shadow-lg',
              isSelected
                ? `bg-gradient-to-br ${algo.color} border-transparent text-white shadow-lg`
                : 'bg-card border-border hover:border-primary/50'
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                'p-2 rounded-lg',
                isSelected ? 'bg-white/20' : 'bg-muted'
              )}>
                <Icon className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-foreground')} />
              </div>
              <div className="text-center">
                <p className={cn(
                  'font-medium text-sm',
                  isSelected ? 'text-white' : 'text-foreground'
                )}>
                  {algo.name}
                </p>
                <p className={cn(
                  'text-xs mt-1 line-clamp-2',
                  isSelected ? 'text-white/80' : 'text-muted-foreground'
                )}>
                  {algo.description}
                </p>
              </div>
            </div>
            {isSelected && (
              <div className="absolute -top-1 -right-1">
                <Zap className="h-5 w-5 text-yellow-300 fill-yellow-300" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// User profile stats component
function UserProfileStats({ profile }) {
  if (!profile) return null;

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-purple-500" />
          Your Taste Profile
        </CardTitle>
        <CardDescription>How our AI understands your preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profile.topGenres?.slice(0, 4).map((genre, idx) => (
            <div key={genre.name} className="text-center">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {Math.round(genre.weight * 100)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">{genre.name}</div>
            </div>
          ))}
        </div>
        {profile.tasteVector && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">Preference Strength</span>
              </div>
              <Progress value={profile.preferenceStrength * 100} className="flex-1 h-2" />
              <span className="font-medium">{Math.round(profile.preferenceStrength * 100)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading skeleton for recommendations
function RecommendationsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// Main AIRecommendations component
export default function AIRecommendations({
  showProfile = true,
  showAlgorithmSelector = true,
  limit = 18,
  className
}) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('hybrid');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch recommendations based on selected algorithm
  const {
    data: recommendationsData,
    isLoading,
    refetch,
    error
  } = useQuery({
    queryKey: ['ai-recommendations', selectedAlgorithm, limit],
    queryFn: () => aiRecommendationsAPI.getRecommendations({
      algorithm: selectedAlgorithm,
      limit
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch user profile
  const { data: profileData } = useQuery({
    queryKey: ['ai-profile'],
    queryFn: () => aiRecommendationsAPI.getUserProfile(),
    enabled: showProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const recommendations = recommendationsData?.recommendations || [];
  const profile = profileData?.profile;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await aiRecommendationsAPI.refresh();
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFeedback = useCallback(async (movieId, helpful) => {
    await aiRecommendationsAPI.submitFeedback({
      recommendationId: movieId,
      helpful,
      algorithm: selectedAlgorithm,
    });
  }, [selectedAlgorithm]);

  const algorithmConfig = ALGORITHMS[selectedAlgorithm];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-500" />
            AI-Powered Recommendations
          </h2>
          <p className="text-muted-foreground mt-1">
            Personalized picks powered by machine learning
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* User Profile Stats */}
      {showProfile && profile && <UserProfileStats profile={profile} />}

      {/* Algorithm Selector */}
      {showAlgorithmSelector && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Choose Algorithm
            </CardTitle>
            <CardDescription>
              Select how you want us to find movies for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlgorithmSelector
              selected={selectedAlgorithm}
              onChange={setSelectedAlgorithm}
            />
          </CardContent>
        </Card>
      )}

      {/* Recommendations Grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <algorithmConfig.icon className={cn(
                  'h-5 w-5',
                  `text-${algorithmConfig.color.split('-')[1]}-500`
                )} />
                {algorithmConfig.name} Recommendations
              </CardTitle>
              <CardDescription className="mt-1">
                {algorithmConfig.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Info className="h-3 w-3" />
              Hover for insights
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <RecommendationsSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Unable to load AI recommendations</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our AI is taking a short break. Try again in a moment.
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No recommendations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Rate some movies and add to your watchlist to train our AI
              </p>
              <Link to="/browse">
                <Button>Browse Movies</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {recommendations.map((rec) => (
                <AIRecommendationCard
                  key={rec.movie?.id || rec.id}
                  movie={rec.movie || rec}
                  explanation={rec.explanation}
                  score={rec.score}
                  algorithm={rec.algorithm || selectedAlgorithm}
                  confidence={rec.confidence}
                  onFeedback={handleFeedback}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works section */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            How AI Recommendations Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Brain className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Learn Your Taste</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Our AI analyzes your ratings, watchlist, and viewing patterns
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Find Similar Users</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  We match you with users who have similar movie preferences
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Personalized Picks</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Combining multiple signals to find your next favorite movie
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
