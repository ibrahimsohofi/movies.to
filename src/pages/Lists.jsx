import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, List, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/services/api';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import EmptyState from '@/components/common/EmptyState';
import MetaTags from '@/components/common/MetaTags';
import CreateListModal from '@/components/lists/CreateListModal';
import ListCard from '@/components/lists/ListCard';

export default function Lists() {
  const { t } = useTranslation();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await api.get('/lists');
      setLists(response.data.lists || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast.error(t('lists.failedToLoadLists', 'Failed to load lists'));
    } finally {
      setLoading(false);
    }
  };

  const handleListCreated = (newList) => {
    setLists([newList, ...lists]);
  };

  const handleListDeleted = (listId) => {
    setLists(lists.filter(list => list.id !== listId));
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <MetaTags
        title={`${t('lists.myLists')} - Movies.to`}
        description={t('lists.manageDescription', 'Manage your movie lists and collections')}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('lists.myLists')}</h1>
          <p className="text-muted-foreground">
            {t('lists.createAndManage', 'Create and manage your custom movie collections')}
          </p>
        </div>

        <CreateListModal onListCreated={handleListCreated} />
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <Link to="/discover-lists">
          <Button variant="outline" className="gap-2">
            <Globe className="h-4 w-4" />
            {t('lists.discoverPublicLists', 'Discover Public Lists')}
          </Button>
        </Link>
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <EmptyState
          icon={List}
          title={t('lists.noListsYet', 'No lists yet')}
          description={t('lists.createFirstList', 'Create your first list to organize your favorite movies')}
          action={
            <CreateListModal
              onListCreated={handleListCreated}
              trigger={
                <Button className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your First List
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onDelete={handleListDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
