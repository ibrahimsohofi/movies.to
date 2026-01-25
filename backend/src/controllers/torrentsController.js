// In-memory cache for torrents (no database required)
const torrentsCache = new Map();

// Read trackers from env or use defaults
const envTrackers = (process.env.TORRENT_TRACKERS || '').split(',').map((t) => t.trim()).filter(Boolean);
const defaultTrackers = [
  'udp://tracker.openbittorrent.com:6969/announce',
  'udp://tracker.opentracker.org:1337/announce',
  'udp://exodus.desync.com:6969',
  'udp://tracker.coppersurfer.tk:6969/announce',
];
const trackers = envTrackers.length ? envTrackers : defaultTrackers;

// Preferred domain from env, with robust fallbacks
const YTS_PREF_DOMAIN = (process.env.YTS_BASE_DOMAIN || 'yts.mx').replace(/^https?:\/\//, '').replace(/\/$/, '');
const YTS_DOMAINS = [YTS_PREF_DOMAIN, 'yts.mx', 'yts.lt'];

const makeMagnet = (hash, title) => {
  const tr = trackers.map((t) => `&tr=${encodeURIComponent(t)}`).join('');
  return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(title)}${tr}`;
};

// TTL in minutes (default 5)
const TTL_MINUTES = parseInt(process.env.TORRENT_CACHE_TTL_MINUTES || '5', 10);

async function fetchYtsByImdb(imdbId) {
  let lastError;
  for (const domain of YTS_DOMAINS) {
    try {
      const url = `https://${domain}/api/v2/movie_details.json?imdb_id=${imdbId}`;
      console.log(`🔍 Trying YTS: ${url}`);
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok) {
        console.log(`❌ YTS failed on ${domain}: ${res.status}`);
        lastError = new Error(`YTS request failed: ${res.status} on ${domain}`);
        continue;
      }
      const json = await res.json();
      console.log(`📦 YTS response from ${domain}:`, JSON.stringify(json, null, 2).slice(0, 500));
      const movie = json?.data?.movie;
      if (!movie) {
        console.log(`⚠️ No movie data from YTS on ${domain}`);
        return { provider: `yts@${domain}`, title: null, imdb_id: imdbId, torrents: [] };
      }
      const title = movie.title_long || movie.title || '';
      const torrents = (movie.torrents || []).map((t) => ({
        quality: t.quality,
        type: t.type, // bluray / web
        seeds: t.seeds,
        peers: t.peers,
        size: t.size,
        size_bytes: t.size_bytes ?? null,
        date_uploaded: t.date_uploaded,
        hash: t.hash,
        magnet: makeMagnet(t.hash, title),
      }));
      return { provider: `yts@${domain}`, title, imdb_id: imdbId, torrents };
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  if (lastError) throw lastError;
  return { provider: 'yts', title: null, imdb_id: imdbId, torrents: [] };
}

export const getTorrentsByImdb = async (req, res) => {
  try {
    const { imdb_id } = req.params;
    const { nocache, provider: providerOverride } = req.query;
    console.log('🎬 Torrents request for IMDB ID:', imdb_id);
    if (!imdb_id) {
      return res.status(400).json({ error: 'imdb_id is required' });
    }

    // Helper: mock provider payload
    const makeMockData = (imdbId) => {
      const title = `Mock Title for ${imdbId}`;
      const base = [
        { quality: '2160p', type: 'bluray', seeds: 1200, peers: 100, size: '8.0 GB', size_bytes: 8 * 1024 * 1024 * 1024, hash: 'MOCK2160P' },
        { quality: '1080p', type: 'web', seeds: 800, peers: 70, size: '3.2 GB', size_bytes: 3200000000, hash: 'MOCK1080P' },
        { quality: '720p', type: 'web', seeds: 300, peers: 30, size: '1.4 GB', size_bytes: 1400000000, hash: 'MOCK720P' },
      ];
      const torrents = base.map((t) => ({
        ...t,
        date_uploaded: new Date().toISOString(),
        magnet: makeMagnet(t.hash, title),
      }));
      return { provider: 'mock', title, imdb_id: imdbId, torrents };
    };

    let data;
    const now = Date.now();
    const provider = (providerOverride || process.env.TORRENT_PROVIDER || 'yts').toLowerCase();
    const cacheKey = `${imdb_id}_${provider}`;

    // Check in-memory cache
    const cached = torrentsCache.get(cacheKey);
    const useCache = cached && !nocache && (now - cached.timestamp) < TTL_MINUTES * 60 * 1000;

    if (useCache) {
      console.log('📦 Using cached torrent data for:', imdb_id);
      data = cached.data;
    } else {
      // Fetch fresh data
      switch (provider) {
        case 'yts':
          data = await fetchYtsByImdb(imdb_id);
          break;
        case 'custom': {
          const base = process.env.TORRENT_API_URL;
          if (!base) {
            // fallback to mock when custom API not configured for QA
            data = makeMockData(imdb_id);
            break;
          }
          const res2 = await fetch(`${base.replace(/\/$/, '')}/imdb/${imdb_id}`);
          if (!res2.ok) throw new Error(`Custom provider failed: ${res2.status}`);
          data = await res2.json();
          break;
        }
        case 'mock':
          data = makeMockData(imdb_id);
          break;
        default:
          data = await fetchYtsByImdb(imdb_id);
      }

      // Save to in-memory cache
      torrentsCache.set(cacheKey, { data, timestamp: now });

      // Clean up old cache entries (keep only last 100)
      if (torrentsCache.size > 100) {
        const entries = Array.from(torrentsCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = entries.slice(0, entries.length - 100);
        toDelete.forEach(([key]) => torrentsCache.delete(key));
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Torrents error:', error);
    // Return empty payload to avoid breaking the UI
    const { imdb_id } = req.params;
    return res.json({ provider: (process.env.TORRENT_PROVIDER || 'yts'), title: null, imdb_id, torrents: [] });
  }
};

export default {
  getTorrentsByImdb,
};
