import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Zap,
  ZapOff,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  HardDrive,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Activity,
  Timer,
  Trash2,
  Play,
  Pause,
  Settings,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

// Mini sparkline chart component
function MiniSparkline({ data, color = 'text-blue-500', height = 24 }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 100 ${height}`} className={cn('w-full', color)} style={{ height }}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Response time badge
function ResponseTimeBadge({ avgTime, trend }) {
  const isGood = avgTime < 50;
  const isFair = avgTime >= 50 && avgTime < 100;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={cn(
          'gap-1',
          isGood && 'bg-green-500/10 text-green-500 border-green-500/30',
          isFair && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
          !isGood && !isFair && 'bg-red-500/10 text-red-500 border-red-500/30'
        )}
      >
        <Timer className="h-3 w-3" />
        {avgTime}ms
      </Badge>
      {trend !== 0 && (
        <span className={cn('text-xs flex items-center gap-0.5', trend < 0 ? 'text-green-500' : 'text-red-500')}>
          {trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}

// Memory usage bar
function MemoryUsageBar({ used, total, className }) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const isWarning = percentage > 70;
  const isCritical = percentage > 90;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <HardDrive className={cn(
            'h-4 w-4',
            isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-blue-500'
          )} />
          Memory Usage
        </span>
        <span className="font-medium">
          {formatBytes(used)} / {formatBytes(total)}
        </span>
      </div>
      <div className="relative">
        <Progress
          value={percentage}
          className={cn(
            'h-2',
            isCritical && '[&>div]:bg-red-500',
            isWarning && !isCritical && '[&>div]:bg-yellow-500'
          )}
        />
        {isCritical && (
          <div className="absolute -right-1 -top-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {percentage.toFixed(1)}% used
        {isCritical && <span className="text-red-500 ml-2">Critical - Consider clearing cache</span>}
        {isWarning && !isCritical && <span className="text-yellow-500 ml-2">Warning - Memory usage high</span>}
      </p>
    </div>
  );
}

// Performance alert component
function PerformanceAlert({ hitRate, responseTime, memoryUsage }) {
  const issues = [];

  if (hitRate < 50) {
    issues.push({ type: 'warning', message: 'Low cache hit rate', detail: 'Consider warming the cache' });
  }
  if (responseTime > 100) {
    issues.push({ type: 'warning', message: 'Slow response times', detail: 'Cache may be overloaded' });
  }
  if (memoryUsage > 90) {
    issues.push({ type: 'error', message: 'Memory critical', detail: 'Clear cache immediately' });
  }

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="text-sm text-green-500 font-medium">All systems healthy</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-2 p-3 rounded-lg border',
            issue.type === 'error'
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-yellow-500/10 border-yellow-500/20'
          )}
        >
          <AlertTriangle className={cn(
            'h-4 w-4 mt-0.5',
            issue.type === 'error' ? 'text-red-500' : 'text-yellow-500'
          )} />
          <div>
            <p className={cn(
              'text-sm font-medium',
              issue.type === 'error' ? 'text-red-500' : 'text-yellow-500'
            )}>
              {issue.message}
            </p>
            <p className="text-xs text-muted-foreground">{issue.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CacheStatusBadge({ className }) {
  const [status, setStatus] = useState({ available: false, hitRate: '0%' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/cache/stats');
      setStatus({
        available: response.data.redisAvailable,
        hitRate: response.data.hitRate || '0%',
        hits: response.data.hits || 0,
        misses: response.data.misses || 0,
        avgResponseTime: response.data.avgResponseTime || 0,
      });
    } catch (error) {
      setStatus({ available: false, hitRate: '0%' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className={cn('gap-1 animate-pulse', className)}>
        <Database className="h-3 w-3" />
        ...
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1 cursor-default transition-colors',
              status.available
                ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20'
                : 'bg-gray-500/10 text-gray-500 border-gray-500/30',
              className
            )}
          >
            {status.available ? (
              <Zap className="h-3 w-3" />
            ) : (
              <ZapOff className="h-3 w-3" />
            )}
            {status.available ? `Cache ${status.hitRate}` : 'No Cache'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {status.available ? (
            <div className="text-xs space-y-1">
              <p className="font-medium">Redis Cache Active</p>
              <p>Hit Rate: {status.hitRate}</p>
              <p>Hits: {status.hits} | Misses: {status.misses}</p>
              {status.avgResponseTime > 0 && <p>Avg Response: {status.avgResponseTime}ms</p>}
            </div>
          ) : (
            <p className="text-xs">Redis cache not available</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function CacheStatusIndicator({ className }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warming, setWarming] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [responseHistory, setResponseHistory] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/cache/stats');
      const newStats = response.data;
      setStats(newStats);

      // Track response time history
      if (newStats.avgResponseTime) {
        setResponseHistory(prev => [...prev.slice(-19), newStats.avgResponseTime]);
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      setStats({ redisAvailable: false });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the cache? This may temporarily slow down the application.')) return;

    try {
      await api.post('/cache/clear');
      fetchStats();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const handleWarmCache = async () => {
    setWarming(true);
    try {
      await api.post('/cache/warm');
      setTimeout(fetchStats, 2000);
    } catch (error) {
      console.error('Error warming cache:', error);
    } finally {
      setWarming(false);
    }
  };

  const handleClearPattern = async (pattern) => {
    try {
      await api.post('/cache/clear', { pattern });
      fetchStats();
    } catch (error) {
      console.error('Error clearing cache pattern:', error);
    }
  };

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hitRate = stats?.total > 0 ? ((stats.hits / stats.total) * 100).toFixed(1) : 0;
  const memoryPercentage = stats?.memoryTotal > 0 ? (stats.memoryUsed / stats.memoryTotal) * 100 : 0;
  const responseTrend = responseHistory.length >= 2
    ? Math.round(((responseHistory[responseHistory.length - 1] - responseHistory[0]) / responseHistory[0]) * 100)
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-blue-500" />
              Cache Performance
              {autoRefresh && stats?.redisAvailable && (
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Redis caching metrics and controls
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                stats?.redisAvailable
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : 'bg-red-500/10 text-red-500 border-red-500/30'
              }
            >
              {stats?.redisAvailable ? (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <ZapOff className="h-3 w-3 mr-1" />
                  Inactive
                </>
              )}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Cache Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 flex items-center justify-between">
                  <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">Auto-refresh</Label>
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleClearPattern('movies:*')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear movie cache
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleClearPattern('search:*')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear search cache
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleClearPattern('user:*')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear user cache
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {stats?.redisAvailable ? (
          <>
            {/* Performance Alert */}
            <PerformanceAlert
              hitRate={Number(hitRate)}
              responseTime={stats?.avgResponseTime || 0}
              memoryUsage={memoryPercentage}
            />

            {/* Hit Rate with Trend */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Hit Rate
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{hitRate}%</span>
                  {Number(hitRate) >= 80 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {Number(hitRate) < 50 && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                </div>
              </div>
              <Progress
                value={Number(hitRate)}
                className={cn(
                  'h-2',
                  Number(hitRate) < 50 && '[&>div]:bg-yellow-500',
                  Number(hitRate) >= 80 && '[&>div]:bg-green-500'
                )}
              />
            </div>

            {/* Response Time with Sparkline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Response Time
                </span>
                <ResponseTimeBadge
                  avgTime={stats?.avgResponseTime || 0}
                  trend={responseTrend}
                />
              </div>
              {responseHistory.length > 1 && (
                <div className="p-2 bg-muted/50 rounded-lg">
                  <MiniSparkline data={responseHistory} color="text-blue-500" height={32} />
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Last {responseHistory.length} measurements
                  </p>
                </div>
              )}
            </div>

            {/* Memory Usage */}
            {stats?.memoryTotal > 0 && (
              <MemoryUsageBar
                used={stats.memoryUsed || 0}
                total={stats.memoryTotal}
              />
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-500">{stats?.hits || 0}</p>
                <p className="text-xs text-muted-foreground">Cache Hits</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-500">{stats?.misses || 0}</p>
                <p className="text-xs text-muted-foreground">Cache Misses</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-blue-500">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>

            {/* Advanced Controls */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full gap-2">
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
                  Advanced Controls
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Cache Warming */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <Flame className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">Cache Warming</h4>
                      <p className="text-xs text-muted-foreground">
                        Pre-populate cache with frequently accessed data
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleWarmCache}
                      disabled={warming}
                      className="gap-2"
                    >
                      {warming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Warming...
                        </>
                      ) : (
                        <>
                          <Flame className="h-4 w-4" />
                          Warm Cache
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Warming targets */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 bg-background rounded">
                      <Activity className="h-3 w-3 text-blue-500" />
                      <span>Trending movies</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-background rounded">
                      <Activity className="h-3 w-3 text-green-500" />
                      <span>Popular genres</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-background rounded">
                      <Activity className="h-3 w-3 text-purple-500" />
                      <span>Search suggestions</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-background rounded">
                      <Activity className="h-3 w-3 text-orange-500" />
                      <span>Homepage data</span>
                    </div>
                  </div>
                </div>

                {/* Cache Info */}
                {stats?.info && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">Cache Info</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {stats.info.uptime && (
                        <div className="flex justify-between p-2 bg-background rounded">
                          <span className="text-muted-foreground">Uptime</span>
                          <span className="font-medium">{Math.floor(stats.info.uptime / 3600)}h</span>
                        </div>
                      )}
                      {stats.info.connectedClients && (
                        <div className="flex justify-between p-2 bg-background rounded">
                          <span className="text-muted-foreground">Clients</span>
                          <span className="font-medium">{stats.info.connectedClients}</span>
                        </div>
                      )}
                      {stats.info.keys && (
                        <div className="flex justify-between p-2 bg-background rounded">
                          <span className="text-muted-foreground">Keys</span>
                          <span className="font-medium">{stats.info.keys}</span>
                        </div>
                      )}
                      {stats.info.version && (
                        <div className="flex justify-between p-2 bg-background rounded">
                          <span className="text-muted-foreground">Redis</span>
                          <span className="font-medium">v{stats.info.version}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCache}
                    className="text-destructive hover:text-destructive gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All Cache
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : (
          <div className="text-center py-6">
            <ZapOff className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Redis cache is not available. The application is running without caching.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Configure REDIS_URL environment variable to enable caching.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
