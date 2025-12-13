import { useEffect, useState, useRef, useMemo } from 'react';
import { ClipboardCopy, RefreshCw, AlertTriangle } from 'lucide-react';
import { torrentsAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatBytes } from '@/lib/utils';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

export default function Torrents({ imdbId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [sortBy, setSortBy] = useState('seeds'); // seeds | quality
  const [sortDir, setSortDir] = useState('desc'); // asc | desc
  const [providerOverride, setProviderOverride] = useState('default'); // 'default', 'yts', 'custom'
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
      console.error('❌ Torrents error:', err);
      setError('Failed to load torrents');
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
    const id = setInterval(() => fetchData(true), REFRESH_MS); // refresh with nocache based on env
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, imdbId, REFRESH_MS, providerOverride]);

  const copyMagnet = async (magnet) => {
    try {
      await navigator.clipboard.writeText(magnet);
      toast.success('Magnet link copied');
    } catch {
      toast.error('Failed to copy');
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

  const qualityColor = (quality) => {
    switch (quality) {
      case '2160p':
        return 'bg-emerald-600';
      case '1080p':
        return 'bg-yellow-600';
      case '720p':
        return 'bg-neutral-600';
      default:
        return 'bg-muted';
    }
  };

  if (!imdbId) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-bold">Torrents</h2>
        <Badge variant="secondary" className="ml-2">Provider: {provider}{data?.provider ? ` (${data.provider})` : ''}</Badge>
        <Button variant="ghost" size="sm" onClick={() => fetchData(true)} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
        <label className="ml-2 text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh ({Math.round(REFRESH_MS / 1000)}s)
        </label>
        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-28 h-8 text-sm" aria-label="Sort by">
                <SelectValue placeholder="seeds" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="seeds">Seeders</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Order</span>
            <Select value={sortDir} onValueChange={setSortDir}>
              <SelectTrigger className="w-24 h-8 text-sm" aria-label="Order">
                <SelectValue placeholder="desc" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Provider</span>
            <Select value={providerOverride} onValueChange={setProviderOverride}>
              <SelectTrigger className="w-28 h-8 text-sm" aria-label="Provider">
                <SelectValue placeholder="default" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="yts">YTS</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {lastUpdatedRef.current && (
          <span className="text-xs text-muted-foreground w-full sm:w-auto">
            Last updated {lastUpdatedRef.current.toLocaleTimeString()}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && data && sortedTorrents.length > 0 ? (
        <div className="space-y-3">
          {sortedTorrents.map((t, idx) => (
            <Card key={`${t.hash}-${idx}`}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Badge className={`text-white ${qualityColor(t.quality)}`}>{t.quality}</Badge>
                  {t.type && (
                    <Badge variant="secondary">{t.type}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Uploaded {new Date(t.date_uploaded).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Seeders:</span> {t.seeds}
                    </div>
                    <div>
                      <span className="font-semibold">Leechers:</span> {t.peers}
                    </div>
                    <div>
                      <span className="font-semibold">Size:</span> {t.size_bytes ? formatBytes(t.size_bytes) : t.size}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono break-all">
                    <span className="px-2 py-1 bg-muted rounded">
                      {expanded[t.hash] ? t.magnet : `${t.magnet.slice(0, 80)}...`}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => toggleExpand(t.hash)} className="h-7 px-2">
                      {expanded[t.hash] ? 'Collapse' : 'Show full'}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => copyMagnet(t.magnet)} className="gap-2">
                    <ClipboardCopy className="h-4 w-4" />
                    Copy Magnet
                  </Button>
                  <a
                    href={t.magnet}
                    className="text-sm underline"
                    onClick={(e) => {
                      // Let the OS handle magnet links if a client is installed
                    }}
                  >
                    Open in Client
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !loading && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No torrents found for this title.
            </CardContent>
          </Card>
        )
      )}
    </section>
  );
}
