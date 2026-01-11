import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import ErrorState from '@/components/common/ErrorState';
import api, { isBackendEnabled } from '@/services/api';
import { Brain, Clock, ChevronRight, Trophy, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function QuizPlay() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (isBackendEnabled()) {
      loadQuiz();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadQuiz = async () => {
    try {
      const response = await api.get(`/quiz/quizzes/${id}`);
      setQuiz(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    const question = quiz.questions[currentQuestion];
    setSelectedAnswers({
      ...selectedAnswers,
      [question.id]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      const response = await api.post(`/quiz/quizzes/${id}/submit`, {
        answers: selectedAnswers,
        timeTaken,
      });

      setResults(response.data.data);
      setShowResults(true);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert(t('common.error'));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  if (!quiz) return <ErrorState message={t('quizPlay.error')} />;

  if (showResults) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="w-20 h-20 text-yellow-500" />
            </div>
            <CardTitle className="text-3xl">{t('quizPlay.results')}</CardTitle>
            <CardDescription>{t('quizPlay.congratulations')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground mb-1">{t('quizPlay.yourScore')}</p>
                <p className="text-3xl font-bold text-primary">{results.score}</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground mb-1">{t('quizPlay.correct')}</p>
                <p className="text-3xl font-bold text-primary">{results.percentage}%</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('quizPlay.correct')}</span>
                <span className="font-semibold">
                  {results.correctAnswers} / {results.totalQuestions}
                </span>
              </div>
              <Progress value={results.percentage} className="h-2" />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate('/quizzes')} className="flex-1">
                {t('quizPlay.backToQuizzes')}
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                {t('quizPlay.tryAgain')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const selectedAnswer = selectedAnswers[question.id];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const answeredAll = Object.keys(selectedAnswers).length === quiz.questions.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
          </div>
          <Badge>{quiz.difficulty}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t('quizPlay.question')} {currentQuestion + 1} {t('quizPlay.of')} {quiz.questions.length}
            </span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatTime(Math.floor((Date.now() - startTime) / 1000))}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">{question.question}</CardTitle>
          {question.hint && (
            <CardDescription className="text-sm">💡 {question.hint}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {question.answers.map((answer, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(answer)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === answer
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{answer}</span>
                  {selectedAnswer === answer && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          variant="outline"
        >
          {t('quizPlay.previous')}
        </Button>

        <div className="flex gap-2">
          {quiz.questions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                selectedAnswers[quiz.questions[index].id]
                  ? 'bg-primary'
                  : index === currentQuestion
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {isLastQuestion ? (
          <Button
            onClick={handleSubmit}
            disabled={!answeredAll}
            className="gap-2"
          >
            {t('quizPlay.submit')}
            <Trophy className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="gap-2"
          >
            {t('quizPlay.next')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {!answeredAll && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {quiz.questions.length - Object.keys(selectedAnswers).length} {t('quizPlay.questionsRemaining')}
        </div>
      )}
    </div>
  );
}
