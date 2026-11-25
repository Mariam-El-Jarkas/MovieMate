import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { upsertMovie, movieOut } from '../tmdb.js';
import { wrap } from '../utils.js';

const r = Router();
r.use(requireAuth);

r.get('/', wrap(async (req, res) => {
  const { rows } = await query(
    'SELECT m.*, w.added_at FROM waitlist w JOIN movies m ON m.id = w.movie_id WHERE w.user_id = $1 ORDER BY w.added_at DESC', [req.userId]);
  res.json({ movies: rows.map(movieOut) });
}));

// Body: { movie: {tmdbId,title,year,posterPath,genres} }
r.post('/', wrap(async (req, res) => {
  const m = await upsertMovie(req.body.movie);
  await query('INSERT INTO waitlist (user_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.userId, m.id]);
  res.status(201).json({ movie: movieOut(m) });
}));

// :movieId is our own movie id (the "id" field in the list above)
r.delete('/:movieId', wrap(async (req, res) => {
  await query('DELETE FROM waitlist WHERE user_id = $1 AND movie_id = $2', [req.userId, Number(req.params.movieId) || 0]);
  res.json({ message: 'Removed.' });
}));

export default r;
