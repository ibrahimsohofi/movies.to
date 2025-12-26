import { query, execute } from '../config/database.js';

// Ensure cache table exists (called on first use)
const ensureCacheTable = async () => {
  // Create table for SQLite or MySQL
  await execute(`
    CREATE TABLE IF NOT EXISTS torrents_cache (
      imdb_id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      cached_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create index separately (works for both SQLite and MySQL)
  try {
    await execute(`CREATE INDEX IF NOT EXISTS idx_cached_at ON torrents_cache(cached_at)`);
  } catch (err) {
    // Index might already exist, ignore error
    if (!err.message.includes('already exists')) {
      console.log('Index creation note:', err.message);
    }
  }
};

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
    await ensureCacheTable();
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

    if (nocache === '1') {
      // Bypass cache
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
      // Update cache with fresh data
      const payload = JSON.stringify(data);
      const cached = await query('SELECT 1 FROM torrents_cache WHERE imdb_id = ?', [imdb_id]);
      if (cached.length > 0) {
        await execute('UPDATE torrents_cache SET data_json = ?, cached_at = strftime(\'%s\', \'now\') WHERE imdb_id = ?', [payload, imdb_id]);
      } else {
        await execute('INSERT INTO torrents_cache (imdb_id, data_json) VALUES (?, ?)', [imdb_id, payload]);
      }
    } else {
      // Use cache if fresh enough
      const cached = await query('SELECT data_json, cached_at FROM torrents_cache WHERE imdb_id = ?', [imdb_id]);

      let useCache = false;
      if (cached.length > 0) {
        // cached_at is unix timestamp in seconds for SQLite, milliseconds for MySQL
        const cachedAt = cached[0].cached_at * 1000; // Convert to milliseconds
        const ageMin = (now - cachedAt) / 60000;
        useCache = ageMin < TTL_MINUTES;
      }

      if (useCache) {
        data = JSON.parse(cached[0].data_json);
      } else {
        switch (provider) {
          case 'yts':
            data = await fetchYtsByImdb(imdb_id);
            break;
          case 'custom': {
            const base = process.env.TORRENT_API_URL;
            if (!base) {
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

        // Save cache
        const payload = JSON.stringify(data);
        if (cached.length > 0) {
          await execute('UPDATE torrents_cache SET data_json = ?, cached_at = strftime(\'%s\', \'now\') WHERE imdb_id = ?', [payload, imdb_id]);
        } else {
          await execute('INSERT INTO torrents_cache (imdb_id, data_json) VALUES (?, ?)', [imdb_id, payload]);
        }
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Torrents error:', error);
    try {
      // Fallback to cached data if available
      const { imdb_id } = req.params;
      const cached = await query('SELECT data_json FROM torrents_cache WHERE imdb_id = ?', [imdb_id]);
      if (cached.length > 0 && cached[0].data_json) {
        return res.json(JSON.parse(cached[0].data_json));
      }
    } catch (cacheErr) {
      console.error('Torrents cache fallback error:', cacheErr);
    }
    // As a final fallback, return an empty payload to avoid breaking the UI
    const { imdb_id } = req.params;
    return res.json({ provider: (process.env.TORRENT_PROVIDER || 'yts'), title: null, imdb_id, torrents: [] });
  }
};

export default {
  getTorrentsByImdb,
};
