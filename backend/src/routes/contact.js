import { Router } from 'express';
import { query } from '../db.js';
import { optionalAuth } from '../auth.js';
import { bad, wrap, str, rateLimit, EMAIL_RE } from '../utils.js';

const r = Router();
r.use(rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }));

r.post('/', optionalAuth, wrap(async (req, res) => {
  const name = str(req.body.name, 80), email = str(req.body.email, 200), subject = str(req.body.subject, 150), message = str(req.body.message, 3000);
  if (!name || !EMAIL_RE.test(email) || !message) throw bad('Fill in your name, a valid email and a message.');
  await query('INSERT INTO contact_messages (user_id, name, email, subject, message) VALUES ($1, $2, $3, $4, $5)', [req.userId || null, name, email, subject || null, message]);
  res.status(201).json({ message: 'Thank you! We got your message.' });
}));

export default r;
