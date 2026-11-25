import { query } from './db.js';
import { mailConfigured, sendMail } from './mail.js';

export async function emailNotification({ userId, actorId = null, type, entryId = null, badgeId = null }) {
  if (!mailConfigured()) return false;
  const { rows } = await query(
    `SELECT recipient.email, COALESCE(settings.notify_email, false) AS notify_email,
       actor.name AS actor_name, movie.title AS movie_title, badge.name AS badge_name
     FROM users recipient
     LEFT JOIN user_settings settings ON settings.user_id = recipient.id
     LEFT JOIN users actor ON actor.id = $2
     LEFT JOIN watch_entries entry ON entry.id = $3
     LEFT JOIN movies movie ON movie.id = entry.movie_id
     LEFT JOIN badges badge ON badge.id = $4
     WHERE recipient.id = $1`, [userId, actorId, entryId, badgeId]);
  const notification = rows[0];
  if (!notification?.notify_email) return false;

  const actor = notification.actor_name || 'Someone';
  const messages = {
    tagged: [`${actor} added you to a movie experience`, `${actor} added you to ${notification.movie_title || 'a movie experience'} on MovieMate.`],
    friend_review: [`${actor} added a movie review`, `${actor} added a review to a movie you share on MovieMate.`],
    friend_request: [`${actor} sent a friend request`, `${actor} sent you a friend request on MovieMate.`],
    friend_accepted: [`${actor} accepted your friend request`, `${actor} accepted your friend request on MovieMate.`],
    badge_earned: [`You earned a MovieMate badge`, `You earned the ${notification.badge_name || 'MovieMate'} badge.`],
  };
  const [subject, text] = messages[type] || ['MovieMate update', 'You have a new MovieMate update.'];
  return sendMail({ to: notification.email, subject, text });
}

export async function notify(db, details) {
  const { userId, actorId = null, type, entryId = null, badgeId = null } = details;
  const result = await (db || { query }).query(
    'INSERT INTO notifications (user_id, actor_id, type, entry_id, badge_id) VALUES ($1, $2, $3, $4, $5)',
    [userId, actorId, type, entryId, badgeId]
  );
  if (!db) {
    emailNotification(details).catch((error) => console.error('Notification email failed:', error));
  }
  return result;
}
