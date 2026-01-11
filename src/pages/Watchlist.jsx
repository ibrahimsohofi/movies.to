import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Star, StickyNote, Flag, X, Edit3, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWatchlistStore } from '@/store/useStore';
import { getImageUrl } from '@/services/tmdb';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Watchlist() {
  const { t } = useTranslation();
  const { watchlist, removeFromWatchlist, updateWatchlistItem } = useWatchlistStore();
  const navigate = useNavigate();
  const [editingMovie, setEditingMovie] = useState(null);
  const [tempRating, setTempRating] = useState(null);
  const [tempNotes, setTempNotes] = useState('');
  const [tempPriority, setTempPriority] = useState('medium');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('added');

  const priorityColors = {
    low: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
    medium: 'bg-yellow-600/10 text-yellow-600 border-yellow-600/20',
    high: 'bg-red-600/10 text-red-600 border-red-600/20',
  };

  const priorityIcons = {
    low: '🟦',
    medium: '🟨',
    high: '🟥',
  };

  const openEditDialog = (movie) => {
    setEditingMovie(movie);
    setTempRating(movie.userRating || null);
    setTempNotes(movie.personalNotes || '');
    setTempPriority(movie.priority || 'medium');
  };

  const saveChanges = () => {
    if (editingMovie) {
      updateWatchlistItem(editingMovie.id, {
        userRating: tempRating,
        personalNotes: tempNotes,
        priority: tempPriority,
      });
      setEditingMovie(null);
    }
  };

  const handleRemove = (movieId, event) => {
    event.stopPropagation();
    removeFromWatchlist(movieId);
  };

  // Filter and sort watchlist
  let filteredWatchlist = [...watchlist];

  if (filterPriority !== 'all') {
    filteredWatchlist = filteredWatchlist.filter(item => item.priority === filterPriority);
  }

  switch (sortBy) {
    case 'added':
      filteredWatchlist.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
      break;
    case 'rating':
      filteredWatchlist.sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
      break;
    case 'priority':
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filteredWatchlist.sort((a, b) => priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium']);
      break;
    case 'title':
      filteredWatchlist.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
  }

  if (watchlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-screen">
        <EmptyState
          icon={Bookmark}
          title={t('watchlist.empty')}
          description={t('watchlist.emptyDesc')}
          actionLabel={t('watchlist.browseMovies', 'Browse Movies')}
          actionHref="/browse"
          illustration="watchlist"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen pb-20">
      {/* Header */}
      <div className="mb-8 animate-slide-in-up">
        <div className="flex items-center gap-3 mb-3">
          <Bookmark className="h-8 w-8 text-red-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
            {t('watchlist.title')}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          {watchlist.length} {t('watchlist.moviesSaved', { count: watchlist.length })}
        </p>
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-wrap gap-4 items-center animate-slide-in-up">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('watchlist.filterByPriority', 'Filter by priority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('watchlist.allPriorities', 'All Priorities')}</SelectItem>
              <SelectItem value="high">🟥 {t('watchlist.high', 'High')}</SelectItem>
              <SelectItem value="medium">🟨 {t('watchlist.medium', 'Medium')}</SelectItem>
              <SelectItem value="low">🟦 {t('watchlist.low', 'Low')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('watchlist.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="added">{t('watchlist.recentlyAdded', 'Recently Added')}</SelectItem>
              <SelectItem value="rating">{t('watchlist.myRating', 'My Rating')}</SelectItem>
              <SelectItem value="priority">{t('watchlist.priority', 'Priority')}</SelectItem>
              <SelectItem value="title">{t('watchlist.titleAZ', 'Title (A-Z)')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Watchlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredWatchlist.map((movie) => (
          <Card
            key={movie.id}
            className="group cursor-pointer hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-red-500/50 overflow-hidden animate-slide-in-up"
          >
            <div className="relative aspect-[2/3] overflow-hidden bg-muted" onClick={() => navigate(`/movie/${movie.id}`)}>
              {movie.poster_path ? (
                <img
                  src={getImageUrl(movie.poster_path, 'w500')}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Bookmark className="h-16 w-16 text-muted-foreground" />
                </div>
              )}

              {/* Priority Badge */}
              <div className="absolute top-2 left-2">
                <Badge className={`${priorityColors[movie.priority || 'medium']} border`}>
                  {priorityIcons[movie.priority || 'medium']} {movie.priority || 'Medium'}
                </Badge>
              </div>

              {/* User Rating */}
              {movie.userRating && (
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs font-bold text-white">{movie.userRating}/10</span>
                </div>
              )}

              {/* Action Buttons Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(movie);
                  }}
                  className="bg-white/90 hover:bg-white"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => handleRemove(movie.id, e)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>

            <CardContent className="p-4" onClick={() => navigate(`/movie/${movie.id}`)}>
              <h3 className="font-semibold line-clamp-1 group-hover:text-red-600 transition-colors mb-2">
                {movie.title}
              </h3>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {movie.release_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                )}
                {movie.vote_average > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {movie.vote_average.toFixed(1)}
                  </span>
                )}
              </div>

              {movie.personalNotes && (
                <div className="flex items-start gap-1 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <StickyNote className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <p className="line-clamp-2">{movie.personalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingMovie} onOpenChange={(open) => !open && setEditingMovie(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-red-600" />
              Edit Watchlist Item
            </DialogTitle>
            <DialogDescription>
              {editingMovie?.title}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="rating" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rating">Rating</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="priority">Priority</TabsTrigger>
            </TabsList>

            <TabsContent value="rating" className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Your Rating</label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[tempRating || 0]}
                    onValueChange={(value) => setTempRating(value[0])}
                    max={10}
                    step={0.5}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 bg-muted px-3 py-2 rounded-lg min-w-[70px] justify-center">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold">{(tempRating || 0).toFixed(1)}</span>
                  </div>
                </div>
                {tempRating > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTempRating(null)}
                    className="mt-2 text-xs"
                  >
                    Clear Rating
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Personal Notes
                </label>
                <Textarea
                  placeholder="Add your thoughts, where you heard about it, or why you want to watch it..."
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {tempNotes.length} characters
                </p>
              </div>
            </TabsContent>

            <TabsContent value="priority" className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Watch Priority
                </label>
                <div className="space-y-2">
                  {['high', 'medium', 'low'].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setTempPriority(priority)}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        tempPriority === priority
                          ? `${priorityColors[priority]} border-current`
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{priorityIcons[priority]}</span>
                        <div>
                          <div className="font-semibold capitalize">{priority} Priority</div>
                          <div className="text-xs text-muted-foreground">
                            {priority === 'high' && 'Watch this ASAP!'}
                            {priority === 'medium' && 'Watch when you have time'}
                            {priority === 'low' && 'Maybe watch later'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setEditingMovie(null)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={saveChanges} className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
