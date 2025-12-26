import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Heart, Edit, Trash2, Reply, ArrowUp, Flag } from 'lucide-react';
import { commentsAPI } from '@/services/api';
import { useAuthStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function Comments({ movieId }) {
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [fallbackMode, setFallbackMode] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  // Client id for anonymous mode to allow editing/deleting own comments
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

  const localKey = `local_comments_${movieId}`;
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
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, sortBy]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setFallbackMode(false);
      // Try backend first with sorting
      const data = await commentsAPI.getMovieComments(movieId, sortBy);
      setComments(data.comments || []);
    } catch (error) {
      // Fallback to local storage
      setFallbackMode(true);
      const localComments = loadLocal();
      // Sort locally if in fallback mode
      setComments(sortLocalComments(localComments, sortBy));
    } finally {
      setLoading(false);
    }
  };

  const sortLocalComments = (items, sort) => {
    const sorted = [...items];
    if (sort === 'oldest') {
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sort === 'mostLiked') {
      return sorted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }
    return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const handleSubmitComment = async (e, parentId = null) => {
    e.preventDefault();
    const text = parentId ? replyText : commentText;

    if (!isAuthenticated && !fallbackMode) {
      toast.error(t('toasts.loginToComment'));
      return;
    }

    if (!text.trim()) return;

    try {
      setIsSubmitting(true);
      if (fallbackMode) {
        const items = loadLocal();
        if (editingCommentId) {
          const updated = items.map((c) =>
            c.id === editingCommentId ? { ...c, comment_text: text } : c
          );
          saveLocal(updated);
          toast.success(t('toasts.commentUpdated'));
          setEditingCommentId(null);
        } else {
          const newItem = {
            id: `c-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
            tmdb_movie_id: movieId,
            comment_text: text,
            parent_id: parentId,
            created_at: new Date().toISOString(),
            username: user?.username || 'Guest',
            user_id: user?.id || clientIdRef.current,
            likes_count: 0,
            userHasLiked: false,
            replies: [],
          };
          saveLocal([newItem, ...items]);
          toast.success(parentId ? t('toasts.replyPosted') : t('toasts.commentPosted'));
        }
        setComments(sortLocalComments(loadLocal(), sortBy));
      } else {
        if (editingCommentId) {
          await commentsAPI.updateComment(editingCommentId, { comment_text: text });
          toast.success(t('toasts.commentUpdated'));
          setEditingCommentId(null);
        } else {
          await commentsAPI.createComment(movieId, { comment_text: text, parent_id: parentId });
          toast.success(parentId ? t('toasts.replyPosted') : t('toasts.commentPosted'));
        }
        fetchComments();
      }
      setCommentText('');
      setReplyText('');
      setReplyingToId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || t('toasts.commentPostFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm(t('movieDetail.deleteCommentConfirm'))) return;

    try {
      if (fallbackMode) {
        const items = loadLocal();
        const filtered = items.filter((c) => c.id !== commentId);
        saveLocal(filtered);
        setComments(sortLocalComments(filtered, sortBy));
        toast.success(t('toasts.commentDeleted'));
      } else {
        await commentsAPI.deleteComment(commentId);
        toast.success(t('toasts.commentDeleted'));
        fetchComments();
      }
    } catch (error) {
      toast.error(t('toasts.commentDeleteFailed'));
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setCommentText(comment.comment_text || comment.comment);
    setReplyingToId(null);
  };

  const handleToggleLike = async (comment) => {
    if (!isAuthenticated && !fallbackMode) {
      toast.error(t('toasts.loginToLike'));
      return;
    }

    try {
      if (fallbackMode) {
        const items = loadLocal();
        const updated = items.map((c) => {
          if (c.id === comment.id) {
            const isLiked = c.userHasLiked;
            return {
              ...c,
              likes_count: isLiked ? Math.max((c.likes_count || 0) - 1, 0) : (c.likes_count || 0) + 1,
              userHasLiked: !isLiked,
            };
          }
          return c;
        });
        saveLocal(updated);
        setComments(sortLocalComments(updated, sortBy));
      } else {
        if (comment.userHasLiked) {
          await commentsAPI.unlikeComment(comment.id);
        } else {
          await commentsAPI.likeComment(comment.id);
        }
        fetchComments();
      }
    } catch (error) {
      toast.error(t('toasts.likeFailed'));
    }
  };

  const canEditDelete = (comment) => {
    return (
      user?.id === comment.user_id ||
      (fallbackMode && clientIdRef.current === comment.user_id)
    );
  };

  const handleReportComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated && !fallbackMode) {
      toast.error(t('toasts.loginToReport'));
      return;
    }

    if (!reportReason.trim()) {
      toast.error(t('toasts.reportReasonRequired'));
      return;
    }

    try {
      if (fallbackMode) {
        toast.success(t('toasts.reportRecorded'));
      } else {
        await commentsAPI.reportComment(reportingCommentId, {
          reason: reportReason,
          description: reportDescription,
        });
        toast.success(t('toasts.reportRecorded'));
      }
      setIsReportDialogOpen(false);
      setReportingCommentId(null);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      toast.error(error.response?.data?.message || t('toasts.reportFailed'));
    }
  };

  // Helper function to render text with @mentions highlighted
  const renderTextWithMentions = (text) => {
    if (!text) return text;

    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.match(/^@\w+$/)) {
        return (
          <span key={index} className="text-red-600 font-medium">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`${isReply ? 'ml-12 mt-3' : ''}`}>
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Comment Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-600 to-pink-600 flex items-center justify-center text-white text-sm font-semibold">
                {comment.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {comment.username || t('movieDetail.anonymous')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {canEditDelete(comment) && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditComment(comment)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Comment Content */}
          <p className="text-sm text-muted-foreground pl-11">
            {renderTextWithMentions(comment.comment_text || comment.comment)}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pl-11">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggleLike(comment)}
                className={`gap-1 h-8 ${comment.userHasLiked ? 'text-red-500' : ''}`}
              >
                <Heart className={`h-3 w-3 ${comment.userHasLiked ? 'fill-current' : ''}`} />
                {comment.likes_count || 0}
              </Button>
              {!isReply && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyingToId(comment.id);
                    setEditingCommentId(null);
                  }}
                  className="gap-1 h-8"
                >
                  <Reply className="h-3 w-3" />
                  {t('movieDetail.reply')}
                </Button>
              )}
            </div>
            {!canEditDelete(comment) && (
              <Dialog open={isReportDialogOpen && reportingCommentId === comment.id} onOpenChange={(open) => {
                setIsReportDialogOpen(open);
                if (!open) {
                  setReportingCommentId(null);
                  setReportReason('');
                  setReportDescription('');
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReportingCommentId(comment.id);
                      setIsReportDialogOpen(true);
                    }}
                    className="gap-1 h-8 text-muted-foreground"
                  >
                    <Flag className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('movieDetail.reportComment')}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleReportComment} className="space-y-4">
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
                          <SelectItem value="hate_speech">{t('movieDetail.hateSpeech')}</SelectItem>
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
                          setReportingCommentId(null);
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

          {/* Reply Form */}
          {replyingToId === comment.id && (
            <div className="pl-11 pt-2">
              <form onSubmit={(e) => handleSubmitComment(e, comment.id)} className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full min-h-20 p-3 rounded-md border bg-background resize-none text-sm"
                  placeholder={t('movieDetail.writeReply')}
                  required
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? t('movieDetail.posting') : t('movieDetail.postReply')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyingToId(null);
                      setReplyText('');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2 mt-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t('movieDetail.comments')}</h2>
          <span className="text-muted-foreground">({comments.length})</span>
        </div>

        {comments.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('movieDetail.sortBy')}</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('movieDetail.newest')}</SelectItem>
                <SelectItem value="oldest">{t('movieDetail.oldest')}</SelectItem>
                <SelectItem value="mostLiked">{t('movieDetail.mostLiked')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Comment Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={(e) => handleSubmitComment(e, null)} className="space-y-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full min-h-24 p-3 rounded-md border bg-background resize-none"
              placeholder={fallbackMode ? t('movieDetail.shareThoughtsLocal') : t('movieDetail.shareThoughts')}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('common.loading')
                  : editingCommentId
                    ? t('common.edit')
                    : t('movieDetail.postComment')}
              </Button>
              {editingCommentId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingCommentId(null);
                    setCommentText('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
              )}
            </div>
            {fallbackMode && (
              <p className="text-xs text-muted-foreground">{t('movieDetail.postingAnonymously')}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {t('movieDetail.noCommentsYet')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </section>
  );
}
