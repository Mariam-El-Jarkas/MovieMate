import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { HttpError, bad, wrap, str, selfUser, USERNAME_RE } from '../utils.js';

const r = Router();
r.use(requireAuth);

r.get('/', (req, res) => res.json({ user: selfUser(req.user) }));

// Numbers for the profile page: watched, waitlist, friends and badges.
r.get('/summary', wrap(async (req, res) => {
  const id = req.userId;
  const [w, wl, f, b] = await Promise.all([
    query('SELECT count(*) AS n FROM reviews WHERE user_id = $1', [id]),
    query('SELECT count(*) AS n FROM waitlist WHERE user_id = $1', [id]),
    query(`SELECT count(*) AS n FROM friendships WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)`, [id]),
    query(`SELECT b.code, b.name, b.min_movies, (ub.user_id IS NOT NULL) AS earned
           FROM badges b LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = $1 ORDER BY b.min_movies`, [id]),
  ]);
  res.json({ watched: w.rows[0].n, waitlist: wl.rows[0].n, friends: f.rows[0].n,
    badges: b.rows.map((x) => ({ code: x.code, name: x.name, minMovies: x.min_movies, earned: x.earned })) });
}));

r.patch('/', wrap(async (req, res) => {
  const u = req.user;
  const name = req.body.name !== undefined ? str(req.body.name, 80) : u.name;
  const username = req.body.username !== undefined ? str(req.body.username, 20) : u.username;
  let avatar = u.avatar_url;
  if (req.body.avatarUrl !== undefined) {
    const a = req.body.avatarUrl;
    if (a === null || a === '') avatar = null;
    else if (typeof a === 'string' && (/^https:\/\//.test(a) || /^data:image\/(png|jpeg);base64,/.test(a)) && a.length < 400000) avatar = a;
    else throw bad('Photo must be a JPG or PNG under about 300 KB.');
  }
  if (!name) throw bad('Name cannot be empty.');
  if (!USERNAME_RE.test(username)) throw bad('Username: 3 to 20 letters, numbers or underscores.');
  const taken = (await query('SELECT id FROM users WHERE lower(username) = lower($1) AND id <> $2', [username, u.id])).rows[0];
  if (taken) throw new HttpError(409, 'That username is taken.');
  const { rows } = await query('UPDATE users SET name = $1, username = $2, avatar_url = $3, updated_at = now() WHERE id = $4 RETURNING *', [name, username, avatar, u.id]);
  res.json({ user: selfUser(rows[0]) });
}));

r.post('/password', wrap(async (req, res) => {
  if (!(await bcrypt.compare(String(req.body.current || ''), req.user.password_hash))) throw new HttpError(401, 'Current password is wrong.');
  if (typeof req.body.next !== 'string' || req.body.next.length < 8) throw bad('New password needs at least 8 characters.');
  await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [await bcrypt.hash(req.body.next, 10), req.userId]);
  res.json({ message: 'Password changed.' });
}));

r.delete('/', wrap(async (req, res) => {
  if (!(await bcrypt.compare(String(req.body.password || ''), req.user.password_hash))) throw new HttpError(401, 'Password is wrong.');
  await query('DELETE FROM users WHERE id = $1', [req.userId]);
  res.json({ message: 'Account deleted.' });
}));

const settingsOut = (s) => ({ tagged: s.notify_tagged, friendReviews: s.notify_friend_reviews, friendRequests: s.notify_friend_requests, email: s.notify_email, seeMovies: s.who_sees_movies, canTag: s.who_can_tag });

r.get('/settings', wrap(async (req, res) => {
  await query('INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [req.userId]);
  res.json({ settings: settingsOut((await query('SELECT * FROM user_settings WHERE user_id = $1', [req.userId])).rows[0]) });
}));

r.put('/settings', wrap(async (req, res) => {
  const b = req.body;
  const bool = (v, d) => (typeof v === 'boolean' ? v : d);
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  const { rows: cur } = await query('INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id RETURNING *', [req.userId]);
  const c = cur[0];
  const { rows } = await query(
    `UPDATE user_settings SET notify_tagged = $2, notify_friend_reviews = $3, notify_friend_requests = $4, notify_email = $5, who_sees_movies = $6, who_can_tag = $7
     WHERE user_id = $1 RETURNING *`,
    [req.userId, bool(b.tagged, c.notify_tagged), bool(b.friendReviews, c.notify_friend_reviews), bool(b.friendRequests, c.notify_friend_requests), bool(b.email, c.notify_email),
      pick(b.seeMovies, ['friends', 'everyone', 'only_me'], c.who_sees_movies), pick(b.canTag, ['friends', 'everyone', 'nobody'], c.who_can_tag)]);
  res.json({ settings: settingsOut(rows[0]) });
}));

export default r;
