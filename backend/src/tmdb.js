import { query } from './db.js';
import { bad } from './utils.js';

const GENRES = { 28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western' };
const IMG = 'https://image.tmdb.org/t/p/w342';

export const posterUrl = (path) => (path ? IMG + path : null);

export async function searchTmdb(q) {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw bad('Movie search is not set up yet. Add TMDB_API_KEY to your .env file.');
  const url = new URL('https://api.themoviedb.org/3/search/movie');
  url.searchParams.set('query', q);
  url.searchParams.set('include_adult', 'false');
  const headers = {};
  if (key.length > 40) headers.Authorization = `Bearer ${key}`; else url.searchParams.set('api_key', key);
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`TMDB responded ${res.status}`);
  const data = await res.json();
  return (data.results || []).slice(0, 8).map((m) => ({
    tmdbId: m.id,
    title: m.title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    posterPath: m.poster_path || null,
    posterUrl: posterUrl(m.poster_path),
    genres: (m.genre_ids || []).map((g) => GENRES[g]).filter(Boolean),
  }));
}

// Saves a movie from the search results into our own table (our cache) and returns its row.
export async function upsertMovie(m, db = { query }) {
  const tmdbId = Number(m?.tmdbId);
  if (!Number.isInteger(tmdbId) || !m?.title) throw bad('Pick a movie from the search results.');
  const { rows } = await db.query(
    `INSERT INTO movies (tmdb_id, title, release_year, poster_path, genres)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tmdb_id) DO UPDATE SET title = EXCLUDED.title, poster_path = COALESCE(EXCLUDED.poster_path, movies.poster_path)
     RETURNING *`,
    [tmdbId, String(m.title).slice(0, 300), Number.isInteger(m.year) ? m.year : null, m.posterPath || null, Array.isArray(m.genres) ? m.genres.slice(0, 5).map(String) : []]
  );
  return rows[0];
}

export const movieOut = (r) => ({ id: r.id, tmdbId: r.tmdb_id, title: r.title, year: r.release_year, genre: (r.genres && r.genres[0]) || '', genres: r.genres || [], posterUrl: posterUrl(r.poster_path) });
