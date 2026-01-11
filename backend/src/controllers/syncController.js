import db from '../config/database.js';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const MOVIE_SYNC_TTL_MINUTES = parseInt(process.env.MOVIE_SYNC_TTL_MINUTES || '60', 10);

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function fetchTmdbMovie(tmdbId) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured');
  }
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}?append_to_response=credits,videos,images`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status}`);
  }
  return res.json();
}

function upsertGenre(tmdbGenre) {
  const existing = db.prepare('SELECT id FROM genres WHERE tmdb_id = ?').get(tmdbGenre.id);
  if (existing) return existing.id;
  const slug = slugify(tmdbGenre.name);
  const result = db
    .prepare('INSERT INTO genres (tmdb_id, name, slug) VALUES (?, ?, ?)')
    .run(tmdbGenre.id, tmdbGenre.name, slug);
  return result.lastInsertRowid;
}

function upsertMovieFromTmdb(tmdb) {
  const existing = db.prepare('SELECT id, updated_at FROM movies WHERE tmdb_id = ?').get(tmdb.id);
  const payload = {
    tmdb_id: tmdb.id,
    title: tmdb.title,
    original_title: tmdb.original_title || tmdb.title,
    overview: tmdb.overview,
    release_date: tmdb.release_date || null,
    runtime: tmdb.runtime || null,
    vote_average: tmdb.vote_average || null,
    vote_count: tmdb.vote_count || null,
    popularity: tmdb.popularity || null,
    poster_path: tmdb.poster_path || null,
    backdrop_path: tmdb.backdrop_path || null,
    original_language: tmdb.original_language || null,
    status: tmdb.status || null,
    tagline: tmdb.tagline || null,
    budget: tmdb.budget || null,
    revenue: tmdb.revenue || null,
    imdb_id: tmdb.imdb_id || null,
  };

  if (existing) {
    db.prepare(
      `UPDATE movies SET
        title = ?, original_title = ?, overview = ?, release_date = ?, runtime = ?,
        vote_average = ?, vote_count = ?, popularity = ?, poster_path = ?, backdrop_path = ?,
        original_language = ?, status = ?, tagline = ?, budget = ?, revenue = ?, imdb_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE tmdb_id = ?`
    ).run(
      payload.title,
      payload.original_title,
      payload.overview,
      payload.release_date,
      payload.runtime,
      payload.vote_average,
      payload.vote_count,
      payload.popularity,
      payload.poster_path,
      payload.backdrop_path,
      payload.original_language,
      payload.status,
      payload.tagline,
      payload.budget,
      payload.revenue,
      payload.imdb_id,
      payload.tmdb_id
    );
    return existing.id;
  }

  const result = db.prepare(
    `INSERT INTO movies (
      tmdb_id, title, original_title, overview, release_date, runtime, vote_average, vote_count,
      popularity, poster_path, backdrop_path, original_language, status, tagline, budget, revenue, imdb_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    payload.tmdb_id,
    payload.title,
    payload.original_title,
    payload.overview,
    payload.release_date,
    payload.runtime,
    payload.vote_average,
    payload.vote_count,
    payload.popularity,
    payload.poster_path,
    payload.backdrop_path,
    payload.original_language,
    payload.status,
    payload.tagline,
    payload.budget,
    payload.revenue,
    payload.imdb_id
  );

  return result.lastInsertRowid;
}

function linkMovieGenres(movieId, tmdbGenres) {
  if (!Array.isArray(tmdbGenres)) return;
  for (const g of tmdbGenres) {
    const genreId = upsertGenre(g);
    const existing = db
      .prepare('SELECT 1 FROM movie_genres WHERE movie_id = ? AND genre_id = ?')
      .get(movieId, genreId);
    if (!existing) {
      db.prepare('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)').run(movieId, genreId);
    }
  }
}

export const syncMovieByTmdbId = async (req, res) => {
  try {
    const { tmdb_id } = req.params;
    const { force, nocache } = req.query;
    if (!tmdb_id) {
      return res.status(400).json({ error: 'tmdb_id is required' });
    }

    // Check TTL cache using movies.updated_at
    const existing = db.prepare('SELECT id, updated_at FROM movies WHERE tmdb_id = ?').get(tmdb_id);
    if (existing && nocache !== '1' && force !== '1') {
      const ageMin = (Date.now() - new Date(existing.updated_at).getTime()) / 60000;
      if (ageMin < MOVIE_SYNC_TTL_MINUTES) {
        return res.json({ message: 'Cached', movieId: existing.id, cachedMinutes: ageMin });
      }
    }

    // Fetch from TMDB and upsert
    const tmdb = await fetchTmdbMovie(tmdb_id);
    const movieId = upsertMovieFromTmdb(tmdb);
    linkMovieGenres(movieId, tmdb.genres);

    return res.json({ message: 'Synced', movieId, tmdb_id });
  } catch (error) {
    console.error('Sync movie error:', error);
    const status = String(error.message || '').includes('TMDB') ? 502 : 500;
    return res.status(status).json({ error: 'Failed to sync movie', details: error.message });
  }
};

export default { syncMovieByTmdbId };
