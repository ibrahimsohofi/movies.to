import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, List, Star, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { api } from '@/services/api';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import EmptyState from '@/components/common/EmptyState';
import MetaTags from '@/components/common/MetaTags';

const ActivityIcon = ({ type }) => {
  switch (type) {
    case 'review':
      return <Star className="h-5 w-5 text-yellow-500" />;
    case 'watchlist_add':
      return <Heart className="h-5 w-5 text-red-500" />;
    case 'list_create':
      return <List className="h-5 w-5 text-blue-500" />;
    case 'comment':
      return <MessageCircle className="h-5 w-5 text-green-500" />;
    default:
      return <Star className="h-5 w-5" />;
  }
};

const ActivityCard = ({ activity }) => {
  const { t } = useTranslation();

  const getActivityText = () => {
    switch (activity.activity_type) {
      case 'review':
        return t('feed.activityTypes.reviewed');
      case 'watchlist_add':
        return t('feed.activityTypes.addedToWatchlist');
      case 'list_create':
        return t('feed.activityTypes.createdList');
      case 'comment':
        return t('feed.activityTypes.commented');
      default:
        return t('feed.activityTypes.interacted');
    }
  };

  const metadata = activity.metadata ? JSON.parse(activity.metadata) : {};

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* User Avatar */}
        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {activity.username?.[0]?.toUpperCase() || 'U'}
        </div>

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link to={`/profile/${activity.user_id}`} className="font-semibold hover:text-primary">
              {activity.username || 'User'}
            </Link>
            <span className="text-muted-foreground">{getActivityText()}</span>
            <ActivityIcon type={activity.activity_type} />
          </div>

          {/* Movie Info */}
          {metadata.movie_title && (
            <Link to={`/movie/${metadata.movie_id}`}>
              <div className="flex items-center gap-3 mb-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                {metadata.movie_poster && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${metadata.movie_poster}`}
                    alt={metadata.movie_title}
                    className="w-16 h-24 object-cover rounded"
                  />
                )}
                <div>
                  <h4 className="font-medium">{metadata.movie_title}</h4>
                  {metadata.movie_year && (
                    <p className="text-sm text-muted-foreground">{metadata.movie_year}</p>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* List Info */}
          {activity.activity_type === 'list_create' && metadata.list_title && (
            <Link to={`/lists/${metadata.list_id}`}>
              <div className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors mb-3">
                <h4 className="font-medium">{metadata.list_title}</h4>
                {metadata.list_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {metadata.list_description}
                  </p>
                )}
              </div>
            </Link>
          )}

          {/* Review/Comment Content */}
          {(activity.activity_type === 'review' || activity.activity_type === 'comment') && metadata.content && (
            <p className="text-sm text-muted-foreground italic line-clamp-3 mb-3">
              "{metadata.content}"
            </p>
          )}

          {/* Rating */}
          {activity.activity_type === 'review' && metadata.rating && (
            <div className="flex items-center gap-1 mb-3">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="font-medium">{metadata.rating}/10</span>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground">
            {new Date(activity.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default function Feed() {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('following');

  useEffect(() => {
    fetchActivities(activeTab);
  }, [activeTab]);

  const fetchActivities = async (type = 'following') => {
    try {
      setLoading(true);
      const endpoint = type === 'following' ? '/feed' : '/feed/trending';
      const response = await api.get(endpoint);
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast.error(t('feed.failedToLoadFeed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <MetaTags
        title="Activity Feed - Movies.to"
        description="See what your friends are watching and reviewing"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('feed.title')}</h1>
        <p className="text-muted-foreground">
          {t('feed.stayUpdated')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="following" className="gap-2">
            <Users className="h-4 w-4" />
            {t('feed.following')}
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('feed.trending')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <LoadingIndicator />
          ) : activities.length === 0 ? (
            <EmptyState
              icon={activeTab === 'following' ? Users : TrendingUp}
              title={activeTab === 'following' ? t('feed.noActivityYet') : t('feed.noTrendingActivity')}
              description={
                activeTab === 'following'
                  ? t('feed.followingDescription')
                  : t('feed.trendingDescription')
              }
              action={
                activeTab === 'following' && (
                  <Link to="/discover-lists">
                    <Button>{t('feed.discoverUsers')}</Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
