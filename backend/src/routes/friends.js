import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { emailNotification, notify } from '../notify.js';
import { HttpError, bad, wrap, str, isUuid, publicUser } from '../utils.js';
import { movieOut } from '../tmdb.js';
import { reviewOut } from '../entries.js';

const r = Router();
r.use(requireAuth);

const other = (f, me) => (f.requester_id === me ? { id: f.addressee_id, name: f.a_name, username: f.a_username, avatar_url: f.a_avatar } : { id: f.requester_id, name: f.r_name, username: f.r_username, avatar_url: f.r_avatar });

r.get('/', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT f.*, ru.name AS r_name, ru.username AS r_username, ru.avatar_url AS r_avatar, au.name AS a_name, au.username AS a_username, au.avatar_url AS a_avatar
     FROM friendships f JOIN users ru ON ru.id = f.requester_id JOIN users au ON au.id = f.addressee_id
     WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status <> 'declined' ORDER BY f.created_at DESC`, [req.userId]);
  const me = req.userId;
  res.json({
    friends: rows.filter((f) => f.status === 'accepted').map((f) => publicUser(other(f, me))),
    requests: rows.filter((f) => f.status === 'pending' && f.addressee_id === me).map((f) => ({ friendshipId: f.id, user: publicUser(other(f, me)) })),
    sent: rows.filter((f) => f.status === 'pending' && f.requester_id === me).map((f) => ({ friendshipId: f.id, user: publicUser(other(f, me)) })),
  });
}));

// Find people by name or @username.
r.get('/search', wrap(async (req, res) => {
  const q = str(req.query.q, 40).replace(/^@/, '').replace(/[\\%_]/g, '\\$&');
  if (q.length < 2) return res.json({ users: [] });
  const { rows } = await query(
    `SELECT u.id, u.name, u.username, u.avatar_url,
       (SELECT f.status FROM friendships f WHERE (f.requester_id = $1 AND f.addressee_id = u.id) OR (f.requester_id = u.id AND f.addressee_id = $1) LIMIT 1) AS status,
       (SELECT f.requester_id FROM friendships f WHERE (f.requester_id = $1 AND f.addressee_id = u.id) OR (f.requester_id = u.id AND f.addressee_id = $1) LIMIT 1) AS requester_id
     FROM users u WHERE u.id <> $1
       AND (u.username ILIKE $2 ESCAPE '\\' OR u.name ILIKE $2 ESCAPE '\\')
     ORDER BY CASE WHEN (
       SELECT f.status FROM friendships f
       WHERE (f.requester_id = $1 AND f.addressee_id = u.id)
          OR (f.requester_id = u.id AND f.addressee_id = $1)
       LIMIT 1
     ) = 'accepted' THEN 1 ELSE 0 END, u.username
     LIMIT 10`, [req.userId, q + '%']);
  res.json({ users: rows.map((u) => ({
    ...publicUser(u),
    friendship: u.status || null,
    friendshipDirection: u.status === 'pending' ? (u.requester_id === req.userId ? 'sent' : 'received') : null,
  })) });
}));

// View a friend's public profile and, when permitted, their recent reviews.
r.get('/:id/profile', wrap(async (req, res) => {
  if (!isUuid(req.params.id)) throw new HttpError(404, 'Not found.');
  const { rows } = await query(
    `SELECT u.id, u.name, u.username, u.avatar_url, COALESCE(s.who_sees_movies, 'friends') AS who_sees_movies,
       EXISTS (SELECT 1 FROM friendships f WHERE f.status = 'accepted'
         AND ((f.requester_id = $1 AND f.addressee_id = u.id) OR (f.requester_id = u.id AND f.addressee_id = $1))) AS are_friends
     FROM users u LEFT JOIN user_settings s ON s.user_id = u.id
     WHERE u.id = $2`, [req.userId, req.params.id]);
  const profile = rows[0];
  if (!profile) throw new HttpError(404, 'User not found.');
  const canViewProfile = profile.id === req.userId
    || profile.who_sees_movies === 'everyone'
    || (profile.who_sees_movies === 'friends' && profile.are_friends);
  if (!canViewProfile) throw new HttpError(404, 'User not found.');
  const canViewMovies = canViewProfile;
  const [friendCount, watchedCount, reviews] = await Promise.all([
    query(`SELECT count(*) AS n FROM friendships WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)`, [profile.id]),
    canViewMovies
      ? query('SELECT count(*) AS n FROM reviews WHERE user_id = $1', [profile.id])
      : Promise.resolve({ rows: [{ n: null }] }),
    canViewMovies
      ? query(
        `SELECT e.id, e.watched_on, m.id AS movie_id, m.tmdb_id, m.title, m.release_year, m.poster_path, m.genres,
           r.review_type, r.overall, r.story, r.acting, r.pacing, r.visuals, r.sound, r.writing, r.emotion,
           r.originality, r.rewatch, r.ending, r.tension, r.theme, r.note, r.tags, r.updated_at
         FROM reviews r JOIN watch_entries e ON e.id = r.entry_id JOIN movies m ON m.id = e.movie_id
         WHERE r.user_id = $1 ORDER BY e.watched_on DESC, r.updated_at DESC LIMIT 6`, [profile.id])
      : Promise.resolve({ rows: [] }),
  ]);
  res.json({
    user: publicUser(profile),
    watchedCount: watchedCount.rows[0].n,
    friendCount: friendCount.rows[0].n,
    canViewMovies,
    reviews: reviews.rows.map((r) => ({
      id: r.id,
      watchedOn: r.watched_on,
      movie: movieOut({ id: r.movie_id, tmdb_id: r.tmdb_id, title: r.title, release_year: r.release_year, poster_path: r.poster_path, genres: r.genres }),
      review: reviewOut(r),
    })),
  });
}));

// Body: { username }
r.post('/request', wrap(async (req, res) => {
  const username = str(req.body.username, 40).replace(/^@/, '');
  const target = (await query('SELECT id FROM users WHERE lower(username) = lower($1)', [username])).rows[0];
  if (!target) throw new HttpError(404, 'No one has that username.');
  if (target.id === req.userId) throw bad('You cannot add yourself.');
  const ex = (await query(
    `SELECT * FROM friendships WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`, [req.userId, target.id])).rows[0];
  if (ex?.status === 'accepted') throw new HttpError(409, 'You are already friends.');
  if (ex?.status === 'pending' && ex.requester_id === req.userId) throw new HttpError(409, 'Request already sent.');
  if (ex?.status === 'pending') { // they already asked me: accept it
    await query(`UPDATE friendships SET status = 'accepted', responded_at = now() WHERE id = $1`, [ex.id]);
    await notify(null, { userId: target.id, actorId: req.userId, type: 'friend_accepted' });
    return res.json({ message: 'You are now friends.', status: 'accepted' });
  }
  if (ex) await query('DELETE FROM friendships WHERE id = $1', [ex.id]); // old declined request
  await query('INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2)', [req.userId, target.id]);
  const s = (await query('SELECT notify_friend_requests, notify_email FROM user_settings WHERE user_id = $1', [target.id])).rows[0];
  const details = { userId: target.id, actorId: req.userId, type: 'friend_request' };
  if (!s || s.notify_friend_requests) await notify(null, details);
  else if (s.notify_email) emailNotification(details).catch((e) => console.error('Notification email failed:', e));
  res.status(201).json({ message: 'Friend request sent.', status: 'pending' });
}));

async function answer(req, res, status) {
  if (!isUuid(req.params.id)) throw new HttpError(404, 'Not found.');
  const updated = (await query(
    `UPDATE friendships SET status = $1, responded_at = now()
     WHERE id = $2 AND addressee_id = $3 AND status = 'pending'
     RETURNING *`, [status, req.params.id, req.userId])).rows[0];
  if (updated) {
    if (status === 'accepted') await notify(null, { userId: updated.requester_id, actorId: req.userId, type: 'friend_accepted' });
    return res.json({ status });
  }
  const existing = (await query(
    'SELECT status FROM friendships WHERE id = $1 AND addressee_id = $2',
    [req.params.id, req.userId])).rows[0];
  if (!existing) throw new HttpError(404, 'Request not found.');
  if (existing.status !== status) throw new HttpError(409, `This request was already ${existing.status}.`);
  res.json({ status });
}
r.post('/:id/accept', wrap((req, res) => answer(req, res, 'accepted')));
r.post('/:id/decline', wrap((req, res) => answer(req, res, 'declined')));

// :id is the other person's user id
r.delete('/:id', wrap(async (req, res) => {
  if (!isUuid(req.params.id)) throw new HttpError(404, 'Not found.');
  await query(`DELETE FROM friendships WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`, [req.userId, req.params.id]);
  res.json({ message: 'Removed.' });
}));

export default r;
