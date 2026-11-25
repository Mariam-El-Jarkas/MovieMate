const TOKEN_KEY = 'mm_token';
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = 'GET', body, token = localStorage.getItem(TOKEN_KEY) } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || 'The request failed. Please try again.', response.status, data);
  return data;
}

export const TOKEN_KEY_NAME = TOKEN_KEY;

export async function searchMovies(q) {
  const s = q.trim();
  if (s.length < 2) return [];
  const { movies } = await api(`/movies/search?q=${encodeURIComponent(s)}`);
  return movies.map((m) => ({ ...m, id: m.tmdbId, genre: m.genres?.[0] || '', pal: 0 }));
}
