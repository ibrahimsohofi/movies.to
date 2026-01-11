import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/services/api';

export default function CreateListModal({ onListCreated, trigger }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [newList, setNewList] = useState({
    title: '',
    description: '',
    is_public: true,
  });
  const [creating, setCreating] = useState(false);

  const handleCreateList = async () => {
    if (!newList.title.trim()) {
      toast.error(t('createList.pleaseEnterTitle'));
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/lists', newList);
      onListCreated(response.data.list);
      setOpen(false);
      setNewList({ title: '', description: '', is_public: true });
      toast.success(t('createList.listCreatedSuccess'));
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error(t('createList.failedToCreate'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            {t('createList.createList')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createList.createNewList')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('createList.listTitle')}</Label>
            <Input
              id="title"
              placeholder={t('createList.listTitlePlaceholder')}
              value={newList.title}
              onChange={(e) => setNewList({ ...newList, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('createList.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('createList.descriptionPlaceholder')}
              value={newList.description}
              onChange={(e) => setNewList({ ...newList, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="public">{t('createList.makeListPublic')}</Label>
            <Switch
              id="public"
              checked={newList.is_public}
              onCheckedChange={(checked) => setNewList({ ...newList, is_public: checked })}
            />
          </div>
          <Button
            onClick={handleCreateList}
            className="w-full"
            disabled={creating}
          >
            {creating ? t('createList.creating') : t('createList.create')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
