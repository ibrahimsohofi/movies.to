import { useState, useEffect } from 'react';
import { Plus, Check, List as ListIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import api from '@/services/api';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import CreateListModal from './CreateListModal';

export default function AddToListModal({ movieId, movieTitle, trigger }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLists, setSelectedLists] = useState(new Set());

  useEffect(() => {
    if (open) {
      fetchLists();
    }
  }, [open]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const response = await api.get('/lists');
      const userLists = response.data.lists || [];
      setLists(userLists);

      // Check which lists already contain this movie
      const listsWithMovie = new Set();
      for (const list of userLists) {
        try {
          const listDetails = await api.get(`/lists/${list.id}`);
          const hasMovie = listDetails.data.movies?.some(m => m.tmdb_id === movieId);
          if (hasMovie) {
            listsWithMovie.add(list.id);
          }
        } catch (error) {
          console.error('Error checking list:', error);
        }
      }
      setSelectedLists(listsWithMovie);
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast.error(t('addToList.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleList = async (listId) => {
    const newSelected = new Set(selectedLists);

    if (newSelected.has(listId)) {
      // Remove from list
      try {
        await api.delete(`/lists/${listId}/movies/${movieId}`);
        newSelected.delete(listId);
        toast.success(t('addToList.removedFromList'));
      } catch (error) {
        console.error('Error removing from list:', error);
        toast.error(t('addToList.failedToRemove'));
        return;
      }
    } else {
      // Add to list
      try {
        await api.post(`/lists/${listId}/movies`, {
          tmdb_id: movieId,
          title: movieTitle,
        });
        newSelected.add(listId);
        toast.success(t('addToList.addedToList'));
      } catch (error) {
        console.error('Error adding to list:', error);
        toast.error(t('addToList.failedToAdd'));
        return;
      }
    }

    setSelectedLists(newSelected);
  };

  const handleListCreated = (newList) => {
    setLists([newList, ...lists]);
    // Automatically add movie to new list
    handleToggleList(newList.id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <div onClick={() => setOpen(true)}>{trigger}</div>}
      {!trigger && (
        <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('addToList.button')}
        </Button>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addToList.title')}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="py-8">
              <LoadingIndicator />
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8">
              <ListIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">{t('addToList.noListsYet')}</p>
              <CreateListModal onListCreated={handleListCreated} />
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                {lists.map((list) => (
                  <div
                    key={list.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => handleToggleList(list.id)}
                  >
                    <Checkbox
                      checked={selectedLists.has(list.id)}
                      onCheckedChange={() => handleToggleList(list.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{list.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {list.movie_count || 0} {t('addToList.movies')}
                      </div>
                    </div>
                    {selectedLists.has(list.id) && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <CreateListModal onListCreated={handleListCreated} />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
