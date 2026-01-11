import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Heart,
  Share2,
  Edit2,
  Trash2,
  Lock,
  Globe,
  Users,
  MessageSquare,
  Activity,
  Settings,
  Check,
  GripVertical,
  LayoutGrid,
  List,
  LayoutList,
  Tag,
  StickyNote,
  MoreHorizontal,
  X,
  Save,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Eye,
  Calendar,
  Star,
  Clock,
  RefreshCw,
  Zap,
  Bell,
  BellOff,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useStore';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import EmptyState from '@/components/common/EmptyState';
import MovieCard from '@/components/movie/MovieCard';
import MetaTags from '@/components/common/MetaTags';
import CollaborativeListManager from '@/components/lists/CollaborativeListManager';
import InviteCollaboratorModal from '@/components/lists/InviteCollaboratorModal';
import ListActivityFeed from '@/components/lists/ListActivityFeed';
import RealTimeIndicator from '@/components/lists/RealTimeIndicator';
import Comments from '@/components/movie/Comments';
import { cn } from '@/lib/utils';

// Available tag colors
const TAG_COLORS = [
  { name: 'red', bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/30' },
  { name: 'orange', bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500/30' },
  { name: 'yellow', bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  { name: 'green', bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/30' },
  { name: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/30' },
  { name: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500/30' },
  { name: 'pink', bg: 'bg-pink-500/20', text: 'text-pink-500', border: 'border-pink-500/30' },
];

// Enhanced Movie Item Component with drag-and-drop
function DraggableMovieItem({
  movie,
  index,
  viewMode,
  canEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging,
  isDragOver,
  onUpdateNote,
  onAddTag,
  onRemoveTag,
}) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(movie.note || '');
  const [showTagPopover, setShowTagPopover] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[0]);

  const handleSaveNote = () => {
    onUpdateNote(movie.id, noteText);
    setShowNoteInput(false);
  };

  const handleAddTag = () => {
    if (newTagText.trim()) {
      onAddTag(movie.id, { text: newTagText.trim(), color: selectedTagColor.name });
      setNewTagText('');
      setShowTagPopover(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        draggable={canEdit}
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragEnd={onDragEnd}
        onDrop={(e) => onDrop(e, index)}
        className={cn(
          'flex items-center gap-4 p-4 bg-card rounded-lg border transition-all duration-200',
          isDragging && 'opacity-50 scale-95',
          isDragOver && 'border-primary border-2 bg-primary/5',
          canEdit && 'cursor-move',
          'group hover:shadow-md'
        )}
      >
        {canEdit && (
          <GripVertical className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}

        <Link to={`/movie/${movie.id}`} className="flex-shrink-0">
          <img
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/movie-poster-fallback.svg'}
            alt={movie.title}
            className="w-16 h-24 object-cover rounded"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/movie/${movie.id}`} className="hover:underline">
            <h3 className="font-semibold truncate">{movie.title}</h3>
          </Link>
          <p className="text-sm text-muted-foreground">
            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
            {movie.vote_average && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                {movie.vote_average.toFixed(1)}
              </span>
            )}
          </p>

          {/* Tags */}
          {movie.tags && movie.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {movie.tags.map((tag, i) => {
                const colorConfig = TAG_COLORS.find(c => c.name === tag.color) || TAG_COLORS[0];
                return (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn('gap-1 text-xs', colorConfig.bg, colorConfig.text, colorConfig.border)}
                  >
                    {tag.text}
                    {canEdit && (
                      <X
                        className="h-3 w-3 cursor-pointer hover:opacity-70"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTag(movie.id, i);
                        }}
                      />
                    )}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Note */}
          {movie.note && !showNoteInput && (
            <p className="text-sm text-muted-foreground mt-2 italic flex items-center gap-1">
              <StickyNote className="h-3 w-3" />
              {movie.note}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Movie Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowNoteInput(!showNoteInput)}>
                  <StickyNote className="h-4 w-4 mr-2" />
                  {movie.note ? 'Edit Note' : 'Add Note'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowTagPopover(true)}>
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tag
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(movie.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Inline Note Editor */}
        {showNoteInput && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-lg p-4 flex items-center gap-2 z-10">
            <Input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              className="flex-1"
              autoFocus
            />
            <Button size="sm" onClick={handleSaveNote}>
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNoteInput(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      className={cn(
        'relative group transition-all duration-200',
        isDragging && 'opacity-50 scale-95',
        isDragOver && 'ring-2 ring-primary ring-offset-2',
        canEdit && 'cursor-move'
      )}
    >
      {/* Drag Handle */}
      {canEdit && (
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/70 rounded p-1">
            <GripVertical className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      {/* Movie Card */}
      <MovieCard movie={movie} />

      {/* Tags overlay */}
      {movie.tags && movie.tags.length > 0 && (
        <div className="absolute bottom-16 left-2 right-2 flex flex-wrap gap-1">
          {movie.tags.slice(0, 2).map((tag, i) => {
            const colorConfig = TAG_COLORS.find(c => c.name === tag.color) || TAG_COLORS[0];
            return (
              <Badge
                key={i}
                variant="outline"
                className={cn('gap-1 text-xs backdrop-blur-sm', colorConfig.bg, colorConfig.text, colorConfig.border)}
              >
                {tag.text}
              </Badge>
            );
          })}
          {movie.tags.length > 2 && (
            <Badge variant="outline" className="text-xs bg-black/50 text-white">
              +{movie.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {canEdit && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Popover open={showTagPopover} onOpenChange={setShowTagPopover}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="secondary" className="h-7 w-7 bg-black/70 hover:bg-black/90">
                <Tag className="h-3 w-3 text-white" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Add Tag</h4>
                <Input
                  value={newTagText}
                  onChange={(e) => setNewTagText(e.target.value)}
                  placeholder="Tag name..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <div className="flex gap-1 flex-wrap">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedTagColor(color)}
                      className={cn(
                        'w-6 h-6 rounded-full transition-all',
                        color.bg,
                        selectedTagColor.name === color.name && 'ring-2 ring-offset-2 ring-primary'
                      )}
                    />
                  ))}
                </div>
                <Button size="sm" onClick={handleAddTag} className="w-full" disabled={!newTagText.trim()}>
                  Add Tag
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="secondary" className="h-7 w-7 bg-black/70 hover:bg-black/90">
                <StickyNote className="h-3 w-3 text-white" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Movie Note</h4>
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                />
                <Button size="sm" onClick={handleSaveNote} className="w-full">
                  Save Note
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            size="icon"
            variant="destructive"
            className="h-7 w-7"
            onClick={() => onDelete(movie.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Note indicator */}
      {movie.note && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-14 right-2">
                <StickyNote className="h-4 w-4 text-yellow-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{movie.note}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// Collaboration Sidebar Component
function CollaborationSidebar({ listId, list, isOpen, onClose, onlineUsers }) {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchRecentActivity();
    }
  }, [isOpen, listId]);

  const fetchRecentActivity = async () => {
    try {
      const response = await api.get(`/collaborative-lists/${listId}/activity?limit=5`);
      setRecentActivity(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed top-0 right-0 h-full w-80 bg-background border-l shadow-xl z-50 transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          Collaboration
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-y-auto h-[calc(100%-60px)] p-4 space-y-6">
        {/* Online Now */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Online Now ({onlineUsers.length})
          </h4>
          {onlineUsers.length > 0 ? (
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {(user.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.username}</p>
                    {user.currentAction && (
                      <p className="text-xs text-muted-foreground truncate">
                        {user.currentAction}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No one else is online</p>
          )}
        </div>

        <Separator />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-2xl font-bold text-blue-500">{list?.movie_count || 0}</p>
            <p className="text-xs text-muted-foreground">Movies</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-2xl font-bold text-green-500">{list?.collaborator_count || 0}</p>
            <p className="text-xs text-muted-foreground">Collaborators</p>
          </div>
        </div>

        <Separator />

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </h4>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Activity className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">
                      <span className="font-medium">{activity.username}</span>
                      {' '}{activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          )}
        </div>

        <Separator />

        {/* Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="text-sm flex items-center gap-2 cursor-pointer">
                {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                Activity Notifications
              </Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [list, setList] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('movies');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);

  // Enhanced state
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showSidebar, setShowSidebar] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [movieMeta, setMovieMeta] = useState({}); // notes and tags per movie

  // Check for invite token in URL
  const inviteToken = searchParams.get('invite');

  useEffect(() => {
    fetchListDetail();

    // Handle invite token if present
    if (inviteToken && user) {
      handleAcceptInvite(inviteToken);
    }
  }, [id, inviteToken, user]);

  // Simulated real-time updates (in production, use WebSocket)
  useEffect(() => {
    if (!realtimeEnabled || !list?.is_collaborative) return;

    const interval = setInterval(() => {
      // Simulate checking for updates
      // In production, this would be WebSocket events
    }, 5000);

    return () => clearInterval(interval);
  }, [realtimeEnabled, list]);

  const fetchListDetail = async () => {
    try {
      const response = await api.get(`/lists/${id}`);
      setList(response.data.list);

      // Initialize movies with any existing metadata
      const moviesWithMeta = (response.data.movies || []).map(movie => ({
        ...movie,
        note: movieMeta[movie.id]?.note || movie.note || '',
        tags: movieMeta[movie.id]?.tags || movie.tags || [],
      }));
      setMovies(moviesWithMeta);

      setIsLiked(response.data.isLiked || false);
      setUserRole(response.data.userRole || null);
    } catch (error) {
      console.error('Error fetching list:', error);
      toast.error(t('listDetail.failedToLoad'));
      navigate('/lists');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (token) => {
    setAcceptingInvite(true);
    try {
      await api.post(`/lists/invite/${token}/accept`);
      toast.success('You have joined the list!');
      fetchListDetail();
      // Remove invite token from URL
      navigate(`/lists/${id}`, { replace: true });
    } catch (error) {
      console.error('Error accepting invite:', error);
      const message = error.response?.data?.error || 'Failed to accept invitation';
      toast.error(message);
    } finally {
      setAcceptingInvite(false);
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await api.delete(`/lists/${id}/like`);
        setIsLiked(false);
        setList({ ...list, like_count: list.like_count - 1 });
        toast.success(t('listDetail.removedFromFavorites'));
      } else {
        await api.post(`/lists/${id}/like`);
        setIsLiked(true);
        setList({ ...list, like_count: (list.like_count || 0) + 1 });
        toast.success(t('listDetail.addedToFavorites'));
      }
    } catch (error) {
      console.error('Error liking list:', error);
      toast.error(t('listDetail.failedToLoad'));
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: list.title,
          text: list.description || `Check out this movie list: ${list.title}`,
          url: url,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast.success(t('common.copied'));
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('common.copied'));
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!confirm('Remove this movie from the list?')) return;

    try {
      await api.delete(`/lists/${id}/movies/${movieId}`);
      setMovies(movies.filter(m => m.id !== movieId));
      toast.success(t('toasts.movieRemovedFromList'));
    } catch (error) {
      console.error('Error removing movie:', error);
      toast.error(t('toasts.movieRemoveFailed'));
    }
  };

  const handleDeleteList = async () => {
    if (!confirm('Are you sure you want to delete this entire list?')) return;

    try {
      await api.delete(`/lists/${id}`);
      toast.success(t('toasts.listDeleted'));
      navigate('/lists');
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error(t('listDetail.failedToLoad'));
    }
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(async (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = draggedIndex;

    if (dragIndex === null || dragIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    // Reorder movies locally
    const newMovies = [...movies];
    const [draggedMovie] = newMovies.splice(dragIndex, 1);
    newMovies.splice(dropIndex, 0, draggedMovie);
    setMovies(newMovies);

    // Save new order to backend
    try {
      await api.put(`/lists/${id}/reorder`, {
        movieIds: newMovies.map(m => m.id),
      });
      toast.success('Order updated');
    } catch (error) {
      console.error('Error reordering:', error);
      // Revert on error
      setMovies(movies);
    }

    handleDragEnd();
  }, [movies, draggedIndex, id]);

  // Note and tag handlers
  const handleUpdateNote = useCallback(async (movieId, note) => {
    setMovies(prev => prev.map(m =>
      m.id === movieId ? { ...m, note } : m
    ));
    setMovieMeta(prev => ({
      ...prev,
      [movieId]: { ...prev[movieId], note }
    }));

    try {
      await api.put(`/lists/${id}/movies/${movieId}/note`, { note });
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [id]);

  const handleAddTag = useCallback(async (movieId, tag) => {
    setMovies(prev => prev.map(m =>
      m.id === movieId ? { ...m, tags: [...(m.tags || []), tag] } : m
    ));

    try {
      await api.post(`/lists/${id}/movies/${movieId}/tags`, { tag });
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  }, [id]);

  const handleRemoveTag = useCallback(async (movieId, tagIndex) => {
    setMovies(prev => prev.map(m =>
      m.id === movieId ? { ...m, tags: m.tags.filter((_, i) => i !== tagIndex) } : m
    ));

    try {
      await api.delete(`/lists/${id}/movies/${movieId}/tags/${tagIndex}`);
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  }, [id]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!list) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="List not found"
          description="This list doesn't exist or you don't have permission to view it"
          action={
            <Link to="/lists">
              <Button>Back to Lists</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isOwner = user && list.user_id === user.id;
  const canEdit = isOwner || userRole === 'admin' || userRole === 'editor';
  const canManage = isOwner || userRole === 'admin';
  const isCollaborative = list.is_collaborative || userRole;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <MetaTags
        title={`${list.title} - Movies.to`}
        description={list.description || `A movie list by ${list.username}`}
      />

      {/* Back Button */}
      <Link to="/lists">
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Lists
        </Button>
      </Link>

      {/* Invite Acceptance Banner */}
      {acceptingInvite && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
          <p className="text-blue-500">Accepting invitation...</p>
        </div>
      )}

      {/* List Header */}
      <Card className="p-8 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h1 className="text-4xl font-bold">{list.title}</h1>
              <Badge variant="outline" className="gap-1">
                {list.is_public ? (
                  <>
                    <Globe className="h-3 w-3" />
                    {t('listDetail.publicList')}
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    {t('listDetail.privateList')}
                  </>
                )}
              </Badge>
              {isCollaborative && (
                <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-500 border-blue-500/30">
                  <Users className="h-3 w-3" />
                  Collaborative
                </Badge>
              )}
              {userRole && (
                <Badge variant="secondary" className="capitalize">
                  {userRole}
                </Badge>
              )}
            </div>
            {list.description && (
              <p className="text-lg text-muted-foreground mb-4">
                {list.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span>{t('listDetail.createdBy')} {list.username || 'Anonymous'}</span>
              <span>•</span>
              <span>{movies.length} {t('listDetail.movies')}</span>
              <span>•</span>
              <span>{list.like_count || 0} {t('discoverLists.likes')}</span>
              <span>•</span>
              <span>Created {new Date(list.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Real-time indicator */}
          {isCollaborative && (
            <div className="hidden md:flex items-center gap-2">
              <RealTimeIndicator listId={id} />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSidebar(true)}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant={isLiked ? 'default' : 'outline'}
              onClick={handleLike}
              className="gap-2"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {isLiked ? t('listDetail.unlike') : t('listDetail.like')}
            </Button>
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              {t('listDetail.share')}
            </Button>
            {canManage && (
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(true)}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Invite
              </Button>
            )}
            {isOwner && (
              <>
                <Button variant="outline" className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  {t('common.edit')}
                </Button>
                <Button variant="destructive" onClick={handleDeleteList} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t('listDetail.delete')}
                </Button>
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </Card>

      {/* Tabs for collaborative lists */}
      {isCollaborative ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="movies" className="gap-2">
              <Plus className="h-4 w-4" />
              Movies ({movies.length})
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="gap-2">
              <Users className="h-4 w-4" />
              Collaborators
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movies">
            {movies.length === 0 ? (
              <EmptyState
                title="No movies in this list yet"
                description={canEdit ? "Start adding movies to your list" : "This list is empty"}
                action={
                  canEdit && (
                    <Link to="/browse">
                      <Button className="gap-2">
                        <Plus className="h-5 w-5" />
                        Browse Movies
                      </Button>
                    </Link>
                  )
                }
              />
            ) : viewMode === 'list' ? (
              <div className="space-y-3">
                {movies.map((movie, index) => (
                  <DraggableMovieItem
                    key={movie.id}
                    movie={movie}
                    index={index}
                    viewMode={viewMode}
                    canEdit={canEdit}
                    onDelete={handleDeleteMovie}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    isDragging={draggedIndex === index}
                    isDragOver={dragOverIndex === index}
                    onUpdateNote={handleUpdateNote}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movies.map((movie, index) => (
                  <DraggableMovieItem
                    key={movie.id}
                    movie={movie}
                    index={index}
                    viewMode={viewMode}
                    canEdit={canEdit}
                    onDelete={handleDeleteMovie}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    isDragging={draggedIndex === index}
                    isDragOver={dragOverIndex === index}
                    onUpdateNote={handleUpdateNote}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="collaborators">
            <CollaborativeListManager
              listId={id}
              isOwner={isOwner}
              currentUserRole={userRole}
              onInvite={() => setShowInviteModal(true)}
            />
          </TabsContent>

          <TabsContent value="activity">
            <ListActivityFeed listId={id} maxHeight={600} />
          </TabsContent>

          <TabsContent value="comments">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                List Comments
              </h3>
              <ListComments listId={id} />
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Non-collaborative list - just show movies
        <>
          {movies.length === 0 ? (
            <EmptyState
              title="No movies in this list yet"
              description={isOwner ? "Start adding movies to your list" : "This list is empty"}
              action={
                isOwner && (
                  <Link to="/browse">
                    <Button className="gap-2">
                      <Plus className="h-5 w-5" />
                      Browse Movies
                    </Button>
                  </Link>
                )
              }
            />
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              {movies.map((movie, index) => (
                <DraggableMovieItem
                  key={movie.id}
                  movie={movie}
                  index={index}
                  viewMode={viewMode}
                  canEdit={isOwner}
                  onDelete={handleDeleteMovie}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  isDragging={draggedIndex === index}
                  isDragOver={dragOverIndex === index}
                  onUpdateNote={handleUpdateNote}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {movies.map((movie, index) => (
                <DraggableMovieItem
                  key={movie.id}
                  movie={movie}
                  index={index}
                  viewMode={viewMode}
                  canEdit={isOwner}
                  onDelete={handleDeleteMovie}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  isDragging={draggedIndex === index}
                  isDragOver={dragOverIndex === index}
                  onUpdateNote={handleUpdateNote}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Invite Modal */}
      <InviteCollaboratorModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        listId={id}
        listTitle={list.title}
        onInviteSent={() => {
          setShowInviteModal(false);
          fetchListDetail();
        }}
      />

      {/* Collaboration Sidebar */}
      {isCollaborative && (
        <>
          <CollaborationSidebar
            listId={id}
            list={list}
            isOpen={showSidebar}
            onClose={() => setShowSidebar(false)}
            onlineUsers={onlineUsers}
          />
          {/* Overlay */}
          {showSidebar && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

// Simple list comments component
function ListComments({ listId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchComments();
  }, [listId]);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/lists/${listId}/comments`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/lists/${listId}/comments`, {
        text: newComment.trim(),
      });
      setComments(prev => [...prev, response.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-muted rounded" />
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1"
          />
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            {submitting ? 'Posting...' : 'Post'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Log in</Link> to comment
        </p>
      )}

      <Separator />

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">
                  {(comment.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{comment.comment_text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
