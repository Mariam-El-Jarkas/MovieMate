import crypto from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; this.extra = extra; }
}
export const bad = (msg, extra) => new HttpError(400, msg, extra);

// Wrap async route handlers so errors reach the error middleware.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || '');

export const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const publicUser = (u) => ({ id: u.id, name: u.name, username: u.username, avatarUrl: u.avatar_url || null });
export const selfUser = (u) => ({ ...publicUser(u), email: u.email });

export const makeCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
export const hashCode = (code, userId) => crypto.createHash('sha256').update(`${code}:${userId}`).digest('hex');

// Tiny in-memory rate limiter (per IP).
export function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(key, arr);
    if (arr.length > max) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
    next();
  };
}
