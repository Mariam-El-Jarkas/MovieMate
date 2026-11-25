import { query } from './db.js';
import { movieOut } from './tmdb.js';
import { publicUser } from './utils.js';
import { notify } from './notify.js';

export const SCORE_KEYS = ['story', 'acting', 'pacing', 'visuals', 'sound', 'writing', 'emotion', 'originality', 'rewatch', 'ending', 'tension', 'theme'];

export const reviewOut = (r) => ({
  type: r.review_type,
  overall: r.overall,
  scores: Object.fromEntries(SCORE_KEYS.filter((k) => r[k] != null).map((k) => [k, r[k]])),
  note: r.note || '',
  tags: r.tags || [],
  updatedAt: r.updated_at,
});

// Loads full entries (movie, people, everyone's reviews) in the same order as `ids`.
export async function loadEntries(ids) {
  if (!ids.length) return [];
  const [e, p, r] = await Promise.all([
    query(
      `SELECT e.id, e.watched_on, e.created_by, m.id AS movie_id, m.tmdb_id, m.title, m.release_year, m.poster_path, m.genres
       FROM watch_entries e JOIN movies m ON m.id = e.movie_id WHERE e.id = ANY($1::uuid[])`, [ids]),
    query(
      `SELECT ep.entry_id, ep.role, u.id, u.name, u.username, u.avatar_url
       FROM entry_participants ep JOIN users u ON u.id = ep.user_id WHERE ep.entry_id = ANY($1::uuid[]) ORDER BY ep.added_at`, [ids]),
    query('SELECT * FROM reviews WHERE entry_id = ANY($1::uuid[])', [ids]),
  ]);
  const byId = new Map(e.rows.map((x) => [x.id, x]));
  return ids.filter((id) => byId.has(id)).map((id) => {
    const x = byId.get(id);
    return {
      id,
      watchedOn: x.watched_on,
      owner: x.created_by,
      movie: movieOut({ id: x.movie_id, tmdb_id: x.tmdb_id, title: x.title, release_year: x.release_year, poster_path: x.poster_path, genres: x.genres }),
      participants: p.rows.filter((q) => q.entry_id === id).map((q) => ({ ...publicUser(q), role: q.role })),
      reviews: Object.fromEntries(r.rows.filter((q) => q.entry_id === id).map((q) => [q.user_id, reviewOut(q)])),
    };
  });
}

// Gives badges (20+, 50+, 100+ movies) when the user reaches them.
export async function checkBadges(userId) {
  const { rows: c } = await query('SELECT count(*) AS n FROM reviews WHERE user_id = $1', [userId]);
  const { rows } = await query(
    `INSERT INTO user_badges (user_id, badge_id)
     SELECT $1, b.id FROM badges b WHERE b.min_movies <= $2
     ON CONFLICT DO NOTHING RETURNING badge_id`, [userId, c[0].n]);
  for (const b of rows) await notify(null, { userId, type: 'badge_earned', badgeId: b.badge_id });
  return rows.map((b) => b.badge_id);
}

export async function areFriends(a, b) {
  const { rows } = await query(
    `SELECT 1 FROM friendships WHERE status = 'accepted'
     AND ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`, [a, b]);
  return rows.length > 0;
}
