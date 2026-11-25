import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { HttpError, wrap, isUuid, publicUser } from '../utils.js';

const r = Router();
r.use(requireAuth);

r.get('/', wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT n.*, a.name AS a_name, a.username AS a_username, a.avatar_url AS a_avatar, m.title AS movie_title, b.name AS badge_name,
       (SELECT f.id FROM friendships f WHERE f.requester_id = n.actor_id AND f.addressee_id = n.user_id LIMIT 1) AS friendship_id,
       (SELECT f.status FROM friendships f WHERE f.requester_id = n.actor_id AND f.addressee_id = n.user_id LIMIT 1) AS friendship_status,
       EXISTS (
         SELECT 1 FROM reviews r
         WHERE r.entry_id = n.entry_id AND r.user_id = n.user_id
       ) AS reviewed
     FROM notifications n LEFT JOIN users a ON a.id = n.actor_id LEFT JOIN watch_entries e ON e.id = n.entry_id
     LEFT JOIN movies m ON m.id = e.movie_id LEFT JOIN badges b ON b.id = n.badge_id
     WHERE n.user_id = $1 ORDER BY n.created_at DESC LIMIT 50`, [req.userId]);
  res.json({
    unread: rows.filter((n) => !n.read_at).length,
    notifications: rows.map((n) => ({
      id: n.id, type: n.type, read: Boolean(n.read_at), createdAt: n.created_at, entryId: n.entry_id, movieTitle: n.movie_title,
      badge: n.badge_name, friendshipId: n.type === 'friend_request' ? n.friendship_id : null,
      friendshipStatus: n.type === 'friend_request' ? n.friendship_status : null,
      reviewed: n.type === 'tagged' ? Boolean(n.reviewed) : null,
      actor: n.actor_id ? publicUser({ id: n.actor_id, name: n.a_name, username: n.a_username, avatar_url: n.a_avatar }) : null,
    })),
  });
}));

r.post('/read-all', wrap(async (req, res) => {
  await query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [req.userId]);
  res.json({ message: 'All read.' });
}));

r.post('/:id/read', wrap(async (req, res) => {
  if (!isUuid(req.params.id)) throw new HttpError(404, 'Not found.');
  await query('UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ message: 'Read.' });
}));

export default r;
