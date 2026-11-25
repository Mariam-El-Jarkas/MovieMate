import { Router } from 'express';
import { pool, query } from '../db.js';
import { requireAuth } from '../auth.js';
import { upsertMovie } from '../tmdb.js';
import { emailNotification, notify } from '../notify.js';
import { SCORE_KEYS, loadEntries, checkBadges, areFriends } from '../entries.js';
import { HttpError, bad, wrap, str, isUuid } from '../utils.js';

const r = Router();
r.use(requireAuth);

// My watched movies (the ones I reviewed), newest first.
r.get('/', wrap(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 24, 100);
  const offset = Number(req.query.offset) || 0;
  const { rows } = await query(
    `SELECT e.id FROM watch_entries e
     JOIN entry_participants ep ON ep.entry_id = e.id AND ep.user_id = $1
     JOIN reviews r ON r.entry_id = e.id AND r.user_id = $1
     ORDER BY e.watched_on DESC, e.created_at DESC LIMIT $2 OFFSET $3`, [req.userId, limit, offset]);
  const total = (await query('SELECT count(*) AS n FROM reviews WHERE user_id = $1', [req.userId])).rows[0].n;
  res.json({ total, entries: await loadEntries(rows.map((x) => x.id)) });
}));

// Movie posts I was tagged in but have not reviewed yet.
r.get('/pending', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT e.id FROM watch_entries e JOIN entry_participants ep ON ep.entry_id = e.id AND ep.user_id = $1
     WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.entry_id = e.id AND r.user_id = $1) ORDER BY e.created_at DESC`, [req.userId]);
  res.json({ entries: await loadEntries(rows.map((x) => x.id)) });
}));

// Start a movie post. Body: { movie: {tmdbId,title,year,posterPath,genres}, with: [userId, ...], watchedOn? }
r.post('/', wrap(async (req, res) => {
  const movie = await upsertMovie(req.body.movie);
  const tagged = [...new Set(Array.isArray(req.body.with) ? req.body.with : [])].filter((x) => isUuid(x) && x !== req.userId).slice(0, 10);
  const watchedOn = /^\d{4}-\d{2}-\d{2}$/.test(req.body.watchedOn || '') ? req.body.watchedOn : null;
  const skipped = [];
  const emailRecipients = [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('INSERT INTO watch_entries (movie_id, created_by, watched_on) VALUES ($1, $2, COALESCE($3::date, current_date)) RETURNING id', [movie.id, req.userId, watchedOn]);
    const entryId = rows[0].id;
    await client.query(`INSERT INTO entry_participants (entry_id, user_id, role) VALUES ($1, $2, 'owner')`, [entryId, req.userId]);
    for (const uid of tagged) {
      const u = (await client.query(
        `SELECT u.id, u.username, COALESCE(s.who_can_tag, 'friends') AS who_can_tag,
           COALESCE(s.notify_tagged, true) AS notify_tagged, COALESCE(s.notify_email, false) AS notify_email
         FROM users u LEFT JOIN user_settings s ON s.user_id = u.id WHERE u.id = $1`, [uid])).rows[0];
      if (!u) continue;
      const allowed = u.who_can_tag === 'everyone' || (u.who_can_tag === 'friends' && (await areFriends(req.userId, uid)));
      if (!allowed) { skipped.push(u.username); continue; }
      await client.query(`INSERT INTO entry_participants (entry_id, user_id, role) VALUES ($1, $2, 'tagged')`, [entryId, uid]);
      if (u.notify_tagged) await notify(client, { userId: uid, actorId: req.userId, type: 'tagged', entryId });
      if (u.notify_email) emailRecipients.push(uid);
    }
    await client.query('COMMIT');
    for (const userId of emailRecipients) {
      emailNotification({ userId, actorId: req.userId, type: 'tagged', entryId })
        .catch((e) => console.error('Notification email failed:', e));
    }
    res.status(201).json({ id: entryId, skipped });
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}));

function parseReview(b) {
  const type = b.type;
  if (type !== 'quick' && type !== 'full') throw bad('type must be "quick" or "full".');
  const score = (v) => { const n = Number(v); if (!Number.isInteger(n) || n < 1 || n > 10) throw bad('Scores must be whole numbers from 1 to 10.'); return n; };
  const note = str(b.note, 140) || null;
  const tags = Array.isArray(b.tags) ? b.tags.map((t) => str(t, 30)).filter(Boolean).slice(0, 6) : [];
  const scores = {};
  let overall;
  if (type === 'full') {
    for (const k of SCORE_KEYS) if (b.scores?.[k] !== undefined && b.scores[k] !== null) scores[k] = score(b.scores[k]);
    const vals = Object.values(scores);
    if (!vals.length) throw bad('Rate at least one question, or send a quick score.');
    overall = Math.round((vals.reduce((a, c) => a + c, 0) / vals.length) * 10) / 10;
  } else {
    overall = score(b.overall);
  }
  return { type, overall, scores, note, tags };
}

// Add or edit MY review on a post. Body: { type: "full", scores: {story: 9, ...} } or { type: "quick", overall: 8, note, tags }
r.put('/:id/review', wrap(async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) throw new HttpError(404, 'Not found.');
  const part = await query('SELECT 1 FROM entry_participants WHERE entry_id = $1 AND user_id = $2', [id, req.userId]);
  if (!part.rows.length) throw new HttpError(404, 'Not found.');
  const rv = parseReview(req.body);
  const cols = SCORE_KEYS;
  const vals = cols.map((k) => rv.scores[k] ?? null);
  const client = await pool.connect();
  let inserted;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO reviews (entry_id, user_id, review_type, overall, ${cols.join(', ')}, note, tags)
       VALUES ($1, $2, $3, $4, ${cols.map((_, i) => '$' + (i + 5)).join(', ')}, $${cols.length + 5}, $${cols.length + 6})
       ON CONFLICT (entry_id, user_id) DO UPDATE SET review_type = EXCLUDED.review_type, overall = EXCLUDED.overall,
         ${cols.map((k) => `${k} = EXCLUDED.${k}`).join(', ')}, note = EXCLUDED.note, tags = EXCLUDED.tags, updated_at = now()
       RETURNING (xmax = 0) AS inserted`,
      [id, req.userId, rv.type, rv.overall, ...vals, rv.note, rv.tags]);
    inserted = rows[0].inserted;
    await client.query(
      'DELETE FROM waitlist w USING watch_entries e WHERE w.user_id = $1 AND e.id = $2 AND w.movie_id = e.movie_id',
      [req.userId, id]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  if (inserted) {
    const others = await query(
      `SELECT ep.user_id, COALESCE(s.notify_friend_reviews, true) AS notify_friend_reviews,
         COALESCE(s.notify_email, false) AS notify_email
       FROM entry_participants ep LEFT JOIN user_settings s ON s.user_id = ep.user_id
       WHERE ep.entry_id = $1 AND ep.user_id <> $2
         AND (COALESCE(s.notify_friend_reviews, true) OR COALESCE(s.notify_email, false))`, [id, req.userId]);
    for (const o of others.rows) {
      const details = { userId: o.user_id, actorId: req.userId, type: 'friend_review', entryId: id };
      if (o.notify_friend_reviews) await notify(null, details);
      else emailNotification(details).catch((e) => console.error('Notification email failed:', e));
    }
  }
  const newBadges = await checkBadges(req.userId);
  res.json({ entry: (await loadEntries([id]))[0], newBadges });
}));

r.get('/:id', wrap(async (req, res) => {
  if (!isUuid(req.params.id)) throw new HttpError(404, 'Not found.');
  const part = await query('SELECT 1 FROM entry_participants WHERE entry_id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!part.rows.length) throw new HttpError(404, 'Not found.');
  res.json({ entry: (await loadEntries([req.params.id]))[0] });
}));

// Only the person who started the post can delete it.
r.delete('/:id', wrap(async (req, res) => {
  if (!isUuid(req.params.id)) throw new HttpError(404, 'Not found.');
  const { rowCount } = await query('DELETE FROM watch_entries WHERE id = $1 AND created_by = $2', [req.params.id, req.userId]);
  if (!rowCount) throw new HttpError(404, 'Not found.');
  res.json({ message: 'Deleted.' });
}));

export default r;
