import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken } from '../auth.js';
import { HttpError, bad, wrap, str, rateLimit, selfUser, USERNAME_RE, EMAIL_RE } from '../utils.js';

const r = Router();
r.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 60 }));

const findByEmail = async (email) => (await query('SELECT * FROM users WHERE lower(email) = $1', [email])).rows[0];
const checkPassword = (p) => { if (typeof p !== 'string' || p.length < 8) throw bad('Password needs at least 8 characters.'); };

r.post('/signup', wrap(async (req, res) => {
  const name = str(req.body.name, 80);
  const username = str(req.body.username, 20);
  const email = str(req.body.email, 200).toLowerCase();
  const password = req.body.password;
  if (!name) throw bad('Enter your name.');
  if (!USERNAME_RE.test(username)) throw bad('Username: 3 to 20 letters, numbers or underscores.');
  if (!EMAIL_RE.test(email)) throw bad('Enter a valid email.');
  checkPassword(password);
  const existing = await findByEmail(email);
  if (existing) throw new HttpError(409, 'That email already has an account. Log in instead.');
  const taken = (await query('SELECT id FROM users WHERE lower(username) = lower($1)', [username])).rows[0];
  if (taken) throw new HttpError(409, 'That username is taken.');
  const hash = await bcrypt.hash(password, 10);
  const user = (await query(
    'INSERT INTO users (name, username, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, username, email, hash],
  )).rows[0];
  res.status(201).json({ token: signToken(user.id), user: selfUser(user) });
}));

r.post('/login', wrap(async (req, res) => {
  const user = await findByEmail(str(req.body.email, 200).toLowerCase());
  const ok = user && (await bcrypt.compare(String(req.body.password || ''), user.password_hash));
  if (!ok) throw new HttpError(401, 'Wrong email or password.');
  res.json({ token: signToken(user.id), user: selfUser(user) });
}));

export default r;
