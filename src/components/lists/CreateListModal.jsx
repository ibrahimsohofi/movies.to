import { useState } from 'react';
import { Plus } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const [newList, setNewList] = useState({
    title: '',
    description: '',
    is_public: true,
  });
  const [creating, setCreating] = useState(false);

  const handleCreateList = async () => {
    if (!newList.title.trim()) {
      toast.error('Please enter a list title');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/lists', newList);
      onListCreated(response.data.list);
      setOpen(false);
      setNewList({ title: '', description: '', is_public: true });
      toast.success('List created successfully!');
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
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
            Create List
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">List Title</Label>
            <Input
              id="title"
              placeholder="e.g., My Favorite Sci-Fi Movies"
              value={newList.title}
              onChange={(e) => setNewList({ ...newList, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your list..."
              value={newList.description}
              onChange={(e) => setNewList({ ...newList, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="public">Make list public</Label>
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
            {creating ? 'Creating...' : 'Create List'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
