import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import ErrorState from '@/components/common/ErrorState';
import api, { isBackendEnabled } from '@/services/api';
import { Brain, Trophy, Clock, Users, Star, TrendingUp, AlertCircle } from 'lucide-react';

export default function Quizzes() {
  const { t } = useTranslation();
  const [quizzes, setQuizzes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only load data if backend is enabled
    if (isBackendEnabled()) {
      loadQuizzes();
      loadLeaderboard();
      loadUserHistory();
    } else {
      setLoading(false);
    }
  }, []);

  const loadQuizzes = async () => {
    try {
      const response = await api.get('/quiz/quizzes');
      setQuizzes(response.data.data);
    } catch (err) {
      console.error('Error loading quizzes:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await api.get('/quiz/leaderboard?limit=5');
      setLeaderboard(response.data.data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
  };

  const loadUserHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get('/quiz/history');
        setUserHistory(response.data.data);
      }
    } catch (err) {
      console.error('Error loading user history:', err);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) return <LoadingIndicator />;
  if (error) return <ErrorState error={error} onRetry={loadQuizzes} />;

  // Show message if backend is not enabled
  if (!isBackendEnabled()) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {t('quiz.errorOccurred', 'Oops! Something went wrong')}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {t('quiz.errorMessage', 'We apologize for the inconvenience. This feature is currently unavailable.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              {t('quiz.errorSuggestion', 'Please try reloading the page or return to the home page.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                className="flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
                {t('quiz.reloadPage', 'Reload Page')}
              </Button>
              <Link to="/">
                <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  {t('quiz.goHome', 'Go to Home')}
                </Button>
              </Link>
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
          <Brain className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold">{t('quiz.title')}</h1>
            <p className="text-muted-foreground">{t('quiz.description')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="quizzes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="quizzes">{t('quiz.tabs.quizzes')}</TabsTrigger>
          <TabsTrigger value="leaderboard">{t('quiz.tabs.leaderboard')}</TabsTrigger>
          <TabsTrigger value="history">{t('quiz.tabs.history')}</TabsTrigger>
        </TabsList>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Brain className="w-8 h-8 text-primary" />
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {t(`quiz.difficulty.${quiz.difficulty}`)}
                    </Badge>
                  </div>
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{quiz.question_count} {t('quiz.questions')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{quiz.total_attempts} {t('quiz.attempts')}</span>
                      </div>
                    </div>
                    <Link to={`/quiz/${quiz.id}`}>
                      <Button className="w-full">
                        {t('quiz.startQuiz')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {quizzes.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">{t('quiz.noQuizzes')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <CardTitle>{t('quiz.topQuizMasters')}</CardTitle>
              </div>
              <CardDescription>{t('quiz.topQuizMastersDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-3">
                        {entry.avatar ? (
                          <img
                            src={entry.avatar}
                            alt={entry.username}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            {entry.username[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{entry.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.quizzes_completed} {t('quiz.quizzesCompleted')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold text-lg">{entry.total_score}</span>
                    </div>
                  </div>
                ))}

                {leaderboard.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('quiz.noLeaderboard')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <CardTitle>{t('quiz.yourHistory')}</CardTitle>
              </div>
              <CardDescription>{t('quiz.trackProgress')}</CardDescription>
            </CardHeader>
            <CardContent>
              {userHistory.length > 0 ? (
                <div className="space-y-3">
                  {userHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                    >
                      <div>
                        <p className="font-semibold">{entry.quiz_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.completed_at).toLocaleDateString()} •{' '}
                          <Badge variant="outline" className="ml-1">
                            {t(`quiz.difficulty.${entry.difficulty}`)}
                          </Badge>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{entry.score} {t('quiz.points')}</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((entry.score / (entry.total_questions * 10)) * 100)}{t('quiz.percentCorrect')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{t('quiz.noHistory')}</p>
                  <p className="text-sm mt-2">{t('quiz.takeFirstQuiz')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
