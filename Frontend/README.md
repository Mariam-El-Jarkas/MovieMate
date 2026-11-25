# MovieMate - Frontend

React + Vite frontend for the MovieMate API. Account, review, waitlist, friend,
notification, profile and settings data are loaded from the backend and stored
in PostgreSQL.

## Run it
1. Install Node.js LTS from https://nodejs.org (once).
2. In this folder:  npm install
3. Configure and run the backend as described in `../backend/README.md`.
4. Optionally copy `.env.example` to `.env` and set `VITE_API_URL` if the backend is not available through the Vite `/api` proxy.
5. In this folder:  npm run dev
6. Open http://localhost:5173 and create an account.

## Where things are
- src/pages       one file per screen
- src/components  navbar, footer, rating slider, movie card
- src/store.jsx   authenticated account state and API-backed data
- src/api.js      shared API client and TMDB movie search
- vite.config.js  proxies /api requests to the backend on port 5000

Email verification, password recovery, and email changes are currently disabled.
Users can sign up immediately; they should keep their password safe.
For production hosting, see `../DEPLOYMENT.md`.
