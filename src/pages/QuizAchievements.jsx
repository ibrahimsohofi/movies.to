import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import ErrorState from '@/components/common/ErrorState';
import api, { isBackendEnabled } from '@/services/api';
import { Trophy, Star, Award, TrendingUp, Target, Zap, AlertCircle } from 'lucide-react';

export default function QuizAchievements() {
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isBackendEnabled()) {
      loadAchievements();
    } else {
      setLoading(false);
    }
  }, []);

  const loadAchievements = async () => {
    try {
      const response = await api.get('/quiz/achievements');
      setAchievements(response.data.data.achievements);
      setStats(response.data.data.stats);
      setLoading(false);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const allAchievements = [
    {
      type: 'first_quiz',
      name: t('quizAchievements.achievements.quizNovice'),
      description: t('quizAchievements.achievements.quizNoviceDesc'),
      icon: '🎯',
      points: 10,
    },
    {
      type: 'perfect_score',
      name: t('quizAchievements.achievements.perfectScore'),
      description: t('quizAchievements.achievements.perfectScoreDesc'),
      icon: '💯',
      points: 50,
    },
    {
      type: 'quiz_master',
      name: t('quizAchievements.achievements.quizMaster'),
      description: t('quizAchievements.achievements.quizMasterDesc'),
      icon: '🎓',
      points: 100,
    },
    {
      type: 'speed_demon',
      name: t('quizAchievements.achievements.speedDemon'),
      description: t('quizAchievements.achievements.speedDemonDesc'),
      icon: '⚡',
      points: 25,
    },
    {
      type: 'knowledge_seeker',
      name: t('quizAchievements.achievements.knowledge'),
      description: t('quizAchievements.achievements.knowledgeDesc'),
      icon: '📚',
      points: 75,
    },
  ];

  const earnedTypes = new Set(achievements.map((a) => a.achievement_type));

  if (loading) return <LoadingIndicator />;
  if (error) return <ErrorState error={error} />;

  // Show message if backend is not enabled
  if (!isBackendEnabled()) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
              <CardTitle>{t('quiz.backendRequired', 'Backend Required')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('quiz.backendRequiredDesc', 'The quiz feature requires the backend server to be running. Please set up and start the backend server to use this feature.')}
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-mono">cd backend && bun run dev</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <div>
            <h1 className="text-4xl font-bold">{t('quizAchievements.title')}</h1>
            <p className="text-muted-foreground">{t('quizAchievements.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('quizAchievements.totalPoints')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-3xl font-bold">{stats.total_points || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('quizAchievements.quizzesCompleted')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-3xl font-bold">{stats.total_quiz_completions || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('quizAchievements.unlocked')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span className="text-3xl font-bold">
                {achievements.length} / {allAchievements.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('quizAchievements.progress')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold">
                  {Math.round((achievements.length / allAchievements.length) * 100)}%
                </span>
              </div>
              <Progress
                value={(achievements.length / allAchievements.length) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">{t('quizAchievements.allAchievements')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allAchievements.map((achievement) => {
            const isEarned = earnedTypes.has(achievement.type);
            const earnedAchievement = achievements.find(
              (a) => a.achievement_type === achievement.type
            );

            return (
              <Card
                key={achievement.type}
                className={`relative overflow-hidden ${
                  isEarned ? 'border-yellow-500/50 bg-yellow-500/5' : 'opacity-60'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-4xl">{achievement.icon}</div>
                    {isEarned && (
                      <Badge className="bg-yellow-500">
                        <Trophy className="w-3 h-3 mr-1" />
                        {t('quizAchievements.unlocked')}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    {achievement.name}
                  </CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{achievement.points} {t('quizAchievements.points')}</span>
                    </div>
                    {isEarned && earnedAchievement && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(earnedAchievement.earned_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">{t('dashboard.recentActivity')}</h2>
          <div className="space-y-3">
            {achievements.slice(0, 5).map((achievement) => (
              <Card key={achievement.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{achievement.achievement_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {achievement.achievement_description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                      <Star className="w-4 h-4" />
                      {achievement.points}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
