import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  BarChart3,
  Activity,
  AlertTriangle,
  Film,
  MessageSquare,
  Star,
  TrendingUp,
  Database,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
// @ts-ignore - JS module
import { useAuthStore } from '@/store/useStore';
// @ts-ignore - JSX module
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - JSX module
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// @ts-ignore - JSX module
import { Button } from '@/components/ui/button';
// @ts-ignore - JSX module
import { Badge } from '@/components/ui/badge';
// @ts-ignore - JSX module
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analytics } from '@/lib/analytics';

export default function Admin() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    uptime: '99.8%',
    activeUsers: 1247,
    apiCalls: 45632,
    errors: 12,
  });

  const [analyticsData, setAnalyticsData] = useState<{
    totalEvents: number;
    popularSearches: Array<{ query: string; count: number }>;
    popularMovies: Array<{ movie: string; count: number }>;
    byCategory: Record<string, number>;
  }>({
    totalEvents: 0,
    popularSearches: [],
    popularMovies: [],
    byCategory: {},
  });

  useEffect(() => {
    // Check if user is admin
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
      return;
    }

    // Load analytics data
    const data = analytics.getAnalyticsSummary();
    setAnalyticsData(data);
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('admin.title')}</h1>
          <p className="text-muted-foreground">{t('admin.subtitle')}</p>
        </div>

        {/* System Health Alert */}
        <Alert className="mb-6">
          <Activity className="h-4 w-4" />
          <AlertTitle>{t('admin.systemStatus')}</AlertTitle>
          <AlertDescription>
            {t('admin.allSystemsOperational')} {t('admin.uptime')}: {systemHealth.uptime} | {t('admin.activeUsers')}:{' '}
            {systemHealth.activeUsers}
          </AlertDescription>
        </Alert>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.activeUsers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.activeUsers}</div>
              <p className="text-xs text-muted-foreground">{t('admin.activeUsersGrowth')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.apiCalls')}</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.apiCalls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{t('admin.apiCallsGrowth')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.totalEvents')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalEvents}</div>
              <p className="text-xs text-muted-foreground">{t('admin.trackedEvents')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.errors')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.errors}</div>
              <p className="text-xs text-muted-foreground">{t('admin.last24Hours')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              {t('admin.tabs.users')}
            </TabsTrigger>
            <TabsTrigger value="moderation">
              <Shield className="h-4 w-4 mr-2" />
              {t('admin.tabs.moderation')}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('admin.tabs.analytics')}
            </TabsTrigger>
            <TabsTrigger value="featured">
              <Star className="h-4 w-4 mr-2" />
              {t('admin.tabs.featured')}
            </TabsTrigger>
            <TabsTrigger value="health">
              <Activity className="h-4 w-4 mr-2" />
              {t('admin.tabs.health')}
            </TabsTrigger>
          </TabsList>

          {/* User Management */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.userManagement')}</CardTitle>
                <CardDescription>{t('admin.userManagementDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">john.doe@example.com</p>
                        <p className="text-sm text-muted-foreground">{t('admin.userSince', { date: 'Jan 2025' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{t('admin.status.active')}</Badge>
                      <Button variant="outline" size="sm">
                        {t('common.edit')}
                      </Button>
                      <Button variant="destructive" size="sm">
                        {t('admin.actions.ban')}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">jane.smith@example.com</p>
                        <p className="text-sm text-muted-foreground">{t('admin.userSince', { date: 'Dec 2024' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{t('admin.status.suspended')}</Badge>
                      <Button variant="outline" size="sm">
                        {t('common.edit')}
                      </Button>
                      <Button variant="default" size="sm">
                        {t('admin.actions.unsuspend')}
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full">{t('admin.loadMoreUsers')}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Moderation */}
          <TabsContent value="moderation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.contentModeration')}</CardTitle>
                <CardDescription>{t('admin.contentModerationDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <MessageSquare className="h-5 w-5 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{t('admin.reviewOn', { title: 'The Dark Knight' })}</p>
                        <Badge variant="destructive">{t('admin.status.flagged')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('admin.moderationExample1')}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          {t('admin.actions.approve')}
                        </Button>
                        <Button size="sm" variant="destructive">
                          {t('admin.actions.remove')}
                        </Button>
                        <Button size="sm" variant="secondary">
                          {t('admin.actions.warnUser')}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <Star className="h-5 w-5 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{t('admin.commentOn', { title: 'Inception' })}</p>
                        <Badge variant="outline">{t('admin.status.pending')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('admin.moderationExample2')}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          {t('admin.actions.approve')}
                        </Button>
                        <Button size="sm" variant="destructive">
                          {t('admin.actions.remove')}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">{t('admin.loadMoreContent')}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Dashboard */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.popularSearches')}</CardTitle>
                  <CardDescription>{t('admin.popularSearchesDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.popularSearches.length > 0 ? (
                    <div className="space-y-3">
                      {analyticsData.popularSearches.map((search: { query: string; count: number }, index: number) => (
                        <div key={search.query} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="text-sm font-medium">{search.query}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{t('admin.searchCount', { count: search.count })}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('admin.noSearchData')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.popularMovies')}</CardTitle>
                  <CardDescription>{t('admin.popularMoviesDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.popularMovies.length > 0 ? (
                    <div className="space-y-3">
                      {analyticsData.popularMovies.map((movie: { movie: string; count: number }, index: number) => (
                        <div key={movie.movie} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="text-sm font-medium">{movie.movie}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{t('admin.viewCount', { count: movie.count })}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('admin.noMovieData')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t('admin.eventCategories')}</CardTitle>
                  <CardDescription>{t('admin.eventCategoriesDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(analyticsData.byCategory).length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(analyticsData.byCategory).map(([category, count]) => (
                        <div key={category} className="p-4 border rounded-lg">
                          <p className="text-sm font-medium mb-1">{category}</p>
                          <p className="text-2xl font-bold">{count as number}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('admin.noEventData')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t('admin.analyticsActions')}</CardTitle>
                  <CardDescription>{t('admin.analyticsActionsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <Button
                    onClick={() => {
                      const data = analytics.exportAnalytics();
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `analytics-${new Date().toISOString()}.json`;
                      a.click();
                    }}
                  >
                    {t('admin.exportAnalytics')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm(t('admin.confirmClearAnalytics'))) {
                        analytics.clearLocalAnalytics();
                        window.location.reload();
                      }
                    }}
                  >
                    {t('admin.clearAnalytics')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Featured Movies Management */}
          <TabsContent value="featured" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.featuredMovies')}</CardTitle>
                <CardDescription>{t('admin.featuredMoviesDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Film className="h-8 w-8" />
                      <div>
                        <p className="font-medium">The Dark Knight</p>
                        <p className="text-sm text-muted-foreground">{t('admin.addedOn', { date: 'Jan 1, 2025' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{t('admin.status.active')}</Badge>
                      <Button variant="outline" size="sm">
                        {t('common.edit')}
                      </Button>
                      <Button variant="destructive" size="sm">
                        {t('admin.actions.remove')}
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full">{t('admin.addFeaturedMovie')}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Health */}
          <TabsContent value="health" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.serverStatus')}</CardTitle>
                  <CardDescription>{t('admin.serverStatusDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('admin.uptime')}</span>
                      <Badge variant="outline">{systemHealth.uptime}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('admin.status.label')}</span>
                      <Badge className="bg-green-500">{t('admin.status.healthy')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('admin.responseTime')}</span>
                      <Badge variant="outline">42ms</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.databaseHealth')}</CardTitle>
                  <CardDescription>{t('admin.databaseHealthDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('admin.connection')}</span>
                      <Badge className="bg-green-500">{t('admin.status.connected')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('admin.queryTime')}</span>
                      <Badge variant="outline">12ms avg</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('admin.activeConnections')}</span>
                      <Badge variant="outline">23</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t('admin.recentErrors')}</CardTitle>
                  <CardDescription>{t('admin.recentErrorsDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t('admin.errorRateLimit')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.errorRateLimitDesc')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t('admin.errorFailedLogin')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.errorFailedLoginDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
