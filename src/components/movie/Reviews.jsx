import { useState, useEffect, useRef, useMemo } from 'react';
import { Star, ThumbsUp, ThumbsDown, Edit, Trash2, ArrowUpDown, Flag } from 'lucide-react';
import { reviewsAPI } from '@/services/api';
import { useAuthStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

export default function Reviews({ movieId }) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  const clientIdRef = useRef(null);
  if (!clientIdRef.current) {
    const existing = localStorage.getItem('client_user_id');
    if (existing) {
      clientIdRef.current = existing;
    } else {
      const cid = `u-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      localStorage.setItem('client_user_id', cid);
      clientIdRef.current = cid;
    }
  }

  const localKey = `local_reviews_${movieId}`;
  const loadLocal = () => {
    try {
      const raw = localStorage.getItem(localKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const saveLocal = (items) => {
    localStorage.setItem(localKey, JSON.stringify(items));
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setFallbackMode(false);
      const data = await reviewsAPI.getMovieReviews(movieId);
      setReviews(data.reviews || []);
    } catch (error) {
      setFallbackMode(true);
      setReviews(loadLocal());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated && !fallbackMode) {
      toast.error('Please login to write a review');
      return;
    }

    try {
      setIsSubmitting(true);
      if (fallbackMode) {
        const items = loadLocal();
        if (editingReviewId) {
          const updated = items.map((r) => (r.id === editingReviewId ? { ...r, rating, review: reviewText } : r));
          saveLocal(updated);
          toast.success('Review updated successfully');
          setEditingReviewId(null);
        } else {
          const newItem = {
            id: `r-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
            tmdb_movie_id: movieId,
            rating,
            review: reviewText,
            created_at: new Date().toISOString(),
            username: user?.username || 'Guest',
            user_id: user?.id || clientIdRef.current,
            helpful_count: 0,
          };
          saveLocal([newItem, ...items]);
          toast.success('Review posted successfully');
        }
        setReviews(loadLocal());
      } else {
        if (editingReviewId) {
          await reviewsAPI.updateReview(editingReviewId, { rating, review_text: reviewText });
          toast.success('Review updated successfully');
          setEditingReviewId(null);
        } else {
          await reviewsAPI.createReview(movieId, { rating, review_text: reviewText });
          toast.success('Review posted successfully');
        }
        setReviewText('');
        setRating(5);
        fetchReviews();
      }
      setReviewText('');
      setRating(5);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      if (fallbackMode) {
        const items = loadLocal();
        const filtered = items.filter((r) => r.id !== reviewId);
        saveLocal(filtered);
        setReviews(filtered);
        toast.success('Review deleted');
      } else {
        await reviewsAPI.deleteReview(reviewId);
        toast.success('Review deleted');
        fetchReviews();
      }
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setReviewText(review.review_text || review.review);
  };

  const handleVote = async (reviewId, voteType) => {
    if (!isAuthenticated && !fallbackMode) {
      toast.error('Please login to vote');
      return;
    }

    try {
      if (fallbackMode) {
        const items = loadLocal();
        const updated = items.map((r) =>
          r.id === reviewId
            ? { ...r, helpful_count: voteType === 'up' ? (r.helpful_count || 0) + 1 : Math.max((r.helpful_count || 0) - 1, 0) }
            : r
        );
        saveLocal(updated);
        setReviews(updated);
      } else {
        await reviewsAPI.voteReview(reviewId, voteType);
        fetchReviews();
      }
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const canEditDelete = (review) => {
    return (
      user?.id === review.user_id ||
      (fallbackMode && clientIdRef.current === review.user_id)
    );
  };

  const handleReportReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated && !fallbackMode) {
      toast.error('Please login to report a review');
      return;
    }

    if (!reportReason.trim()) {
      toast.error('Please select a reason');
      return;
    }

    try {
      if (fallbackMode) {
        toast.success('Report recorded (local mode)');
      } else {
        await reviewsAPI.reportReview(reportingReviewId, {
          reason: reportReason,
          description: reportDescription,
        });
      }
      setIsReportDialogOpen(false);
      setReportingReviewId(null);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report review');
    }
  };

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];

    switch (sortBy) {
      case 'helpful':
        return sorted.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
      case 'highest':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'lowest':
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [reviews, sortBy]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('movieDetail.reviews')}</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                <span className="text-xl font-semibold">{averageRating}</span>
              </div>
              <span className="text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? t('movieDetail.review') : t('movieDetail.reviewsCount')})
              </span>
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('movieDetail.sortBy')}</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{t('movieDetail.mostRecent')}</SelectItem>
                <SelectItem value="helpful">{t('movieDetail.mostHelpful')}</SelectItem>
                <SelectItem value="highest">{t('movieDetail.highestRating')}</SelectItem>
                <SelectItem value="lowest">{t('movieDetail.lowestRating')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Write Review Form */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">
            {editingReviewId ? t('movieDetail.editYourReview') : t('movieDetail.writeReview')}
          </h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('movieDetail.yourRating')}</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`p-2 rounded transition-colors ${
                      value <= rating
                        ? 'text-yellow-500'
                        : 'text-muted-foreground hover:text-yellow-500'
                    }`}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
                <span className="ml-2 text-lg font-semibold">{rating}/10</span>
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('movieDetail.yourReview')}</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full min-h-32 p-3 rounded-md border bg-background"
                placeholder={fallbackMode ? t('movieDetail.shareThoughtsReviewLocal') : t('movieDetail.shareThoughtsReview')}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('common.loading')
                  : editingReviewId
                    ? t('common.edit')
                    : t('movieDetail.postReview')}
              </Button>
              {editingReviewId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingReviewId(null);
                    setReviewText('');
                    setRating(5);
                  }}
                >
                  {t('common.cancel')}
                </Button>
              )}
            </div>
            {fallbackMode && (
              <p className="text-xs text-muted-foreground/60 italic">
                {t('reviews.localModeNote', 'Note: Reviews are saved locally in your browser')}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-20 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {t('movieDetail.noReviewsYet')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6 space-y-4">
                {/* Review Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                      {review.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold">{review.username || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {review.rating}/10
                    </Badge>
                    {canEditDelete(review) && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditReview(review)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-muted-foreground leading-relaxed">{review.review_text || review.review}</p>

                {/* Vote Buttons */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleVote(review.id, 'up')}
                      className="gap-1"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {t('movieDetail.helpful')} ({review.helpful_count || 0})
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleVote(review.id, 'down')}
                      className="gap-1"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                  {!canEditDelete(review) && (
                    <Dialog open={isReportDialogOpen && reportingReviewId === review.id} onOpenChange={(open) => {
                      setIsReportDialogOpen(open);
                      if (!open) {
                        setReportingReviewId(null);
                        setReportReason('');
                        setReportDescription('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReportingReviewId(review.id);
                            setIsReportDialogOpen(true);
                          }}
                          className="gap-1 text-muted-foreground"
                        >
                          <Flag className="h-4 w-4" />
                          {t('movieDetail.report')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('movieDetail.reportReview')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleReportReview} className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">{t('movieDetail.reason')}</label>
                            <Select value={reportReason} onValueChange={setReportReason}>
                              <SelectTrigger>
                                <SelectValue placeholder={t('movieDetail.selectReason')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="spam">{t('movieDetail.spam')}</SelectItem>
                                <SelectItem value="harassment">{t('movieDetail.harassment')}</SelectItem>
                                <SelectItem value="inappropriate">{t('movieDetail.inappropriateContent')}</SelectItem>
                                <SelectItem value="spoilers">{t('movieDetail.spoilers')}</SelectItem>
                                <SelectItem value="misinformation">{t('movieDetail.misinformation')}</SelectItem>
                                <SelectItem value="other">{t('movieDetail.other')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">{t('movieDetail.additionalDetails')}</label>
                            <textarea
                              value={reportDescription}
                              onChange={(e) => setReportDescription(e.target.value)}
                              className="w-full min-h-24 p-3 rounded-md border bg-background"
                              placeholder={t('movieDetail.provideContext')}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsReportDialogOpen(false);
                                setReportingReviewId(null);
                                setReportReason('');
                                setReportDescription('');
                              }}
                            >
                              {t('common.cancel')}
                            </Button>
                            <Button type="submit" variant="destructive">
                              {t('movieDetail.submitReport')}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
