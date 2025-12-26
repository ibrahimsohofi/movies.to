import { useEffect, useState, useRef, useMemo } from 'react';
import { ClipboardCopy, RefreshCw, AlertTriangle, Download, ArrowUpDown, Settings2, CheckCircle2, Users, HardDrive, Calendar, ExternalLink } from 'lucide-react';
import { torrentsAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatBytes } from '@/lib/utils';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export default function Torrents({ imdbId }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [sortBy, setSortBy] = useState('seeds');
  const [sortDir, setSortDir] = useState('desc');
  const [providerOverride, setProviderOverride] = useState('default');
  const lastUpdatedRef = useRef(null);

  const provider = (import.meta.env.VITE_TORRENT_PROVIDER || 'YTS').toUpperCase();
  const REFRESH_MS = Number(import.meta.env.VITE_TORRENTS_REFRESH_MS || 30000);

  const fetchData = async (forceFresh = false) => {
    if (!imdbId) {
      console.log('⚠️ No IMDB ID provided to Torrents component');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('🎬 Fetching torrents for IMDB ID:', imdbId);
      const actualProvider = providerOverride === 'default' ? '' : providerOverride;
      const qs = new URLSearchParams();
      if (forceFresh) qs.set('nocache', '1');
      if (actualProvider) qs.set('provider', actualProvider);
      const res = await torrentsAPI.getByImdb(imdbId, { nocache: forceFresh, provider: actualProvider });
      console.log('📦 Torrents response:', res);
      setData(res);
      lastUpdatedRef.current = new Date();
    } catch (err) {
      console.log('ℹ️ Torrents unavailable (backend not running)');
      setError(t('torrents.backendNotAvailable'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imdbId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => fetchData(true), REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, imdbId, REFRESH_MS, providerOverride]);

  const copyMagnet = async (magnet) => {
    try {
      await navigator.clipboard.writeText(magnet);
      toast.success(t('toasts.magnetCopied'));
    } catch {
      toast.error(t('toasts.magnetCopyFailed'));
    }
  };

  const toggleExpand = (hash) => {
    setExpanded((prev) => ({ ...prev, [hash]: !prev[hash] }));
  };

  const qualityWeight = (q) => {
    if (!q) return 0;
    if (q.includes('2160')) return 2160;
    if (q.includes('1080')) return 1080;
    if (q.includes('720')) return 720;
    return 0;
  };

  const sortedTorrents = useMemo(() => {
    if (!data?.torrents) return [];
    const items = [...data.torrents];
    items.sort((a, b) => {
      let av, bv;
      if (sortBy === 'seeds') {
        av = a.seeds || 0;
        bv = b.seeds || 0;
      } else {
        av = qualityWeight(a.quality);
        bv = qualityWeight(b.quality);
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return items;
  }, [data, sortBy, sortDir]);

  const qualityGradient = (quality) => {
    switch (quality) {
      case '2160p':
        return 'from-emerald-500 to-teal-600';
      case '1080p':
        return 'from-amber-500 to-orange-600';
      case '720p':
        return 'from-slate-500 to-slate-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getHealthStatus = (seeds) => {
    if (seeds > 100) return { label: t('torrents.healthExcellent'), color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' };
    if (seeds > 50) return { label: t('torrents.healthGood'), color: 'text-green-500', bgColor: 'bg-green-500/10' };
    if (seeds > 10) return { label: t('torrents.healthFair'), color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
    return { label: t('torrents.healthPoor'), color: 'text-red-500', bgColor: 'bg-red-500/10' };
  };

  // Hide section if no IMDB ID, error, or no torrents available
  if (!imdbId) return null;
  if (!loading && error) return null;
  if (!loading && data && sortedTorrents.length === 0) return null;

  return (
    <section className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-600">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('torrents.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('torrents.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-2 px-3 py-1">
              <Settings2 className="h-3 w-3" />
              {provider}{data?.provider ? ` (${data.provider})` : ''}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('torrents.refresh')}
            </Button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="font-medium">{t('torrents.autoRefresh')}</span>
              <span className="text-muted-foreground">({Math.round(REFRESH_MS / 1000)}s)</span>
            </label>

            {lastUpdatedRef.current && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3" />
                {t('torrents.updated')} {lastUpdatedRef.current.toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-28 h-9 text-sm">
                  <SelectValue placeholder={t('torrents.sort')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seeds">{t('torrents.seeders')}</SelectItem>
                  <SelectItem value="quality">{t('torrents.quality')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={sortDir} onValueChange={setSortDir}>
              <SelectTrigger className="w-24 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{t('torrents.desc')}</SelectItem>
                <SelectItem value="asc">{t('torrents.asc')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={providerOverride} onValueChange={setProviderOverride}>
              <SelectTrigger className="w-32 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t('torrents.default')}</SelectItem>
                <SelectItem value="yts">YTS</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="animate-pulse">
                <div className="h-24 bg-gradient-to-r from-muted via-muted/80 to-muted" />
                <CardContent className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-muted rounded w-24" />
                    <div className="h-8 bg-muted rounded w-24" />
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">{t('torrents.serviceUnavailable')}</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Torrents List */}
      {!loading && data && sortedTorrents.length > 0 ? (
        <div className="grid gap-4">
          {sortedTorrents.map((torrent, idx) => {
            const health = getHealthStatus(torrent.seeds);
            return (
              <Card key={`${torrent.hash}-${idx}`} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                {/* Quality Header Banner */}
                <div className={`h-2 bg-gradient-to-r ${qualityGradient(torrent.quality)}`} />

                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Top Row - Quality & Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`bg-gradient-to-r ${qualityGradient(torrent.quality)} text-white border-0 px-3 py-1 text-sm font-semibold`}>
                          {torrent.quality}
                        </Badge>
                        {torrent.type && (
                          <Badge variant="outline" className="font-medium">
                            {torrent.type}
                          </Badge>
                        )}
                        <Badge className={`${health.bgColor} ${health.color} border-0`}>
                          {health.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(torrent.date_uploaded).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <Users className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('torrents.seeders')}</p>
                          <p className="font-semibold text-lg">{torrent.seeds}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <Users className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('torrents.leechers')}</p>
                          <p className="font-semibold text-lg">{torrent.peers}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <HardDrive className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('torrents.size')}</p>
                          <p className="font-semibold text-lg">{torrent.size_bytes ? formatBytes(torrent.size_bytes) : torrent.size}</p>
                        </div>
                      </div>
                    </div>

                    {/* Magnet Link */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('torrents.magnetLink')}</p>
                      <div className="relative">
                        <div className="p-3 bg-muted/50 rounded-lg border font-mono text-xs break-all overflow-hidden">
                          {expanded[torrent.hash] ? torrent.magnet : `${torrent.magnet.slice(0, 100)}...`}
                        </div>
                        <button
                          onClick={() => toggleExpand(torrent.hash)}
                          className="absolute top-2 right-2 px-2 py-1 bg-background border rounded text-xs hover:bg-muted transition-colors"
                        >
                          {expanded[torrent.hash] ? t('torrents.showLess') : t('torrents.showMore')}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        onClick={() => copyMagnet(torrent.magnet)}
                        className="flex-1 gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                      >
                        <ClipboardCopy className="h-4 w-4" />
                        {t('torrents.copyMagnetLink')}
                      </Button>
                      <Button
                        variant="outline"
                        asChild
                        className="flex-1 gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <a href={torrent.magnet}>
                          <ExternalLink className="h-4 w-4" />
                          {t('torrents.openInClient')}
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        !loading && !error && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-muted">
                  <Download className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('torrents.noTorrentsAvailable')}</h3>
                  <p className="text-sm text-muted-foreground">{t('torrents.noTorrentsFound')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </section>
  );
}
