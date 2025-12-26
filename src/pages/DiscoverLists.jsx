import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, Globe, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { api } from '@/services/api';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import EmptyState from '@/components/common/EmptyState';
import MetaTags from '@/components/common/MetaTags';

export default function DiscoverLists() {
  const { t } = useTranslation();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('popular');

  useEffect(() => {
    fetchPublicLists(activeTab);
  }, [activeTab]);

  const fetchPublicLists = async (sortBy = 'popular') => {
    try {
      setLoading(true);
      const response = await api.get(`/lists/public?sort=${sortBy}`);
      setLists(response.data.lists || []);
    } catch (error) {
      console.error('Error fetching public lists:', error);
      toast.error(t('discoverLists.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (listId) => {
    try {
      const list = lists.find(l => l.id === listId);
      if (list.isLiked) {
        await api.delete(`/lists/${listId}/like`);
      } else {
        await api.post(`/lists/${listId}/like`);
      }

      setLists(lists.map(l =>
        l.id === listId
          ? { ...l, isLiked: !l.isLiked, like_count: l.like_count + (l.isLiked ? -1 : 1) }
          : l
      ));
    } catch (error) {
      console.error('Error liking list:', error);
      toast.error(t('discoverLists.failedToLoad'));
    }
  };

  const filteredLists = lists.filter(list =>
    list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <MetaTags
        title={`${t('discoverLists.title')} - Movies.to`}
        description={t('discoverLists.subtitle')}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('discoverLists.title')}</h1>
        <p className="text-muted-foreground">
          {t('discoverLists.subtitle')}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('discoverLists.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="popular" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('discoverLists.popular')}
          </TabsTrigger>
          <TabsTrigger value="recent" className="gap-2">
            <Globe className="h-4 w-4" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <Heart className="h-4 w-4" />
            {t('discoverLists.trending')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <LoadingIndicator />
          ) : filteredLists.length === 0 ? (
            <EmptyState
              icon={Globe}
              title={t('discoverLists.noLists')}
              description={searchQuery ? "Try a different search term" : "No public lists available yet"}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLists.map((list) => (
                <Card key={list.id} className="p-6 hover:shadow-lg transition-shadow">
                  {/* List Info */}
                  <div className="mb-4">
                    <Link to={`/lists/${list.id}`}>
                      <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                        {list.title}
                      </h3>
                    </Link>
                    {list.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {list.description}
                      </p>
                    )}
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-semibold">
                      {list.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{list.username || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(list.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">
                      {list.movie_count || 0} {t('discoverLists.movies')}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Heart className="h-3 w-3" />
                      {list.like_count || 0} {t('discoverLists.likes')}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link to={`/lists/${list.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        {t('common.viewList')}
                      </Button>
                    </Link>
                    <Button
                      variant={list.isLiked ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => handleLike(list.id)}
                    >
                      <Heart className={`h-4 w-4 ${list.isLiked ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
