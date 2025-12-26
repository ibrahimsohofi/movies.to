import { Link } from 'react-router-dom';
import { Globe, Lock, Heart, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/services/api';

export default function ListCard({ list, onDelete }) {
  const { t } = useTranslation();
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      await api.delete(`/lists/${list.id}`);
      onDelete(list.id);
      toast.success('List deleted successfully');
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link to={`/lists/${list.id}`}>
            <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
              {list.title}
            </h3>
          </Link>
          {list.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {list.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="gap-1">
          {list.is_public ? (
            <>
              <Globe className="h-3 w-3" />
              Public
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              Private
            </>
          )}
        </Badge>
        <Badge variant="secondary">
          {list.movie_count || 0} movies
        </Badge>
        {list.like_count > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Heart className="h-3 w-3" />
            {list.like_count}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link to={`/lists/${list.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            {t('common.viewList')}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          title="Delete list"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Created {new Date(list.created_at).toLocaleDateString()}
      </div>
    </Card>
  );
}
