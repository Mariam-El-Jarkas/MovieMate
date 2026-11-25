import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool } from './db.js';
import { HttpError } from './utils.js';
import auth from './routes/auth.js';
import me from './routes/me.js';
import movies from './routes/movies.js';
import entries from './routes/entries.js';
import waitlist from './routes/waitlist.js';
import friends from './routes/friends.js';
import notifications from './routes/notifications.js';
import contact from './routes/contact.js';

function validateProductionEnvironment() {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = ['DATABASE_URL', 'TMDB_API_KEY'].filter((key) => !process.env[key]?.trim());
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || /change-me|your[_-]?secret/i.test(secret)) missing.push('a strong JWT_SECRET (at least 32 characters)');
  if (process.env.RESEND_API_KEY && !process.env.MAIL_FROM?.trim()) missing.push('MAIL_FROM when RESEND_API_KEY is set');

  const origins = (process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean);
  if (!origins.length) missing.push('CLIENT_URL');
  for (const origin of origins) {
    let parsed;
    try { parsed = new URL(origin); } catch { parsed = null; }
    if (!parsed || parsed.origin !== origin || parsed.protocol !== 'https:') {
      throw new Error('In production, CLIENT_URL must contain HTTPS origins only, without paths or trailing slashes.');
    }
  }

  if (missing.length) throw new Error(`Missing or unsafe production configuration: ${missing.join(', ')}.`);
}

validateProductionEnvironment();

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, database: 'connected' }); }
  catch (e) {
    console.error('Health check database query failed:', e);
    res.status(500).json({ ok: false, database: 'not connected' });
  }
});

app.use('/api/auth', auth);
app.use('/api/me', me);
app.use('/api/movies', movies);
app.use('/api/entries', entries);
app.use('/api/waitlist', waitlist);
app.use('/api/friends', friends);
app.use('/api/notifications', notifications);
app.use('/api/contact', contact);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Every error ends up here and is sent as { error: "message" }.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.extra });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That is too big.' });
  if (err.code === '23505') return res.status(409).json({ error: 'That already exists.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`MovieMate API running on http://localhost:${port}`));
