import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { searchTmdb } from '../tmdb.js';
import { wrap, str } from '../utils.js';

const r = Router();
r.use(requireAuth);

// GET /api/movies/search?q=inter
r.get('/search', wrap(async (req, res) => {
  const q = str(req.query.q, 100);
  res.json({ movies: q.length < 2 ? [] : await searchTmdb(q) });
}));

export default r;
