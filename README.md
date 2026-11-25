<div align="center">
  <img src="Frontend/public/logo.jpeg" alt="MovieMate logo" width="128" />
  <h1>MovieMate</h1>
  <p><strong>Your movie journal, shared with friends.</strong></p>
  <p>Track what you watch, write reviews, keep a watchlist, and see what your friends think.</p>
  <p>
    <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" />
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18%2B-5FA04E?logo=nodedotjs&logoColor=white" />
    <img alt="Express" src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white" />
  </p>
</div>

MovieMate is a movie journal and small social space for movie fans. Keep a
personal record of what you have watched, rate and review films, save titles
for later, and share your movie activity with friends.

## Features

- Search movie information provided by [TMDB](https://www.themoviedb.org/).
- Keep a watched-movie journal with ratings, tags, and personal notes.
- Add movies to a watchlist and review them later.
- Find friends, send and manage friend requests, and browse friends' profiles
  and reviews.
- Get notifications about friend activity and review mentions.
- Manage profile details, privacy preferences, and account settings.
- Use a responsive interface designed for mobile and desktop.

## Technology

- **Frontend:** React, React Router, Vite
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Movie data:** TMDB API

## Project layout

```text
MovieMate/
├── Frontend/       React application
├── backend/        Express API and PostgreSQL migrations
└── DEPLOYMENT.md   Hosting and production configuration checklist
```

## Run locally

### Requirements

- Node.js 18 or newer
- PostgreSQL, either local or hosted
- A TMDB API key

### 1. Configure and start the backend

Open PowerShell in the repository and run:

```powershell
cd backend
Copy-Item .env.example .env
npm ci
```

Edit `backend/.env` and set `DATABASE_URL`, `JWT_SECRET`, and `TMDB_API_KEY`.
For hosted PostgreSQL that requires TLS, set `DB_SSL=true`; certificate
verification stays enabled. Keep `.env` private and never commit it.

Create or update the database schema, then start the API:

```powershell
npm run migrate
npm run dev
```

The API runs at `http://localhost:5000`. Check the database connection at
[`http://localhost:5000/api/health`](http://localhost:5000/api/health).

### 2. Start the frontend

In a second terminal, from the repository root:

```powershell
cd Frontend
npm ci
npm run dev
```

Open [`http://localhost:5173`](http://localhost:5173). During local development,
Vite proxies `/api` requests to the backend on port `5000`.

## Environment variables

Backend configuration is documented in [`backend/.env.example`](backend/.env.example).
The frontend's optional public API-origin setting is documented in
[`Frontend/.env.example`](Frontend/.env.example).

For separate production frontend and backend hosting, set `VITE_API_URL` to the
backend's HTTPS origin in the frontend build environment. Set `CLIENT_URL` to
the frontend's HTTPS origin in the backend environment. See the
[deployment checklist](DEPLOYMENT.md) for all production settings and steps.

## Build

Build the frontend for production:

```powershell
cd Frontend
npm ci
npm run build
```

## Account and email limitations

Signup and login do not require email delivery. Email verification, password
recovery, and changing the login email are not currently available. A signed-in
user can change their password by providing their current password. Contact form
submissions are stored in the database; they are not currently forwarded by
email or displayed in an admin inbox.

## Movie data attribution

MovieMate uses TMDB's API for movie information. This product uses the TMDB API
but is not endorsed or certified by TMDB.
