import jwt from 'jsonwebtoken';
import { query } from './db.js';
import { HttpError } from './utils.js';

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing in .env');
  return process.env.JWT_SECRET;
};

export const signToken = (userId) => jwt.sign({ sub: userId }, secret(), { expiresIn: '7d' });

function readToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) throw new HttpError(401, 'Please log in.');
    let payload;
    try { payload = jwt.verify(token, secret()); } catch { throw new HttpError(401, 'Your session expired. Please log in again.'); }
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    if (!rows[0]) throw new HttpError(401, 'Account not found.');
    req.user = rows[0];
    req.userId = rows[0].id;
    next();
  } catch (e) { next(e); }
}

// Like requireAuth, but allows guests (used by the contact form).
export async function optionalAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (token) {
      const payload = jwt.verify(token, secret());
      const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
      if (rows[0]) { req.user = rows[0]; req.userId = rows[0].id; }
    }
  } catch { /* guest */ }
  next();
}
