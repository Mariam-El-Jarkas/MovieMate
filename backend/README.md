# MovieMate - Backend (Node.js + Express + PostgreSQL)

## First time setup
1. In this folder, make your settings file:   copy .env.example .env
2. Open .env and fill in:
   - DATABASE_URL  -> put YOUR postgres password instead of YOUR_PASSWORD
   - JWT_SECRET    -> any long random text. To make one:
       node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   - TMDB_API_KEY  -> free key from themoviedb.org (Settings > API)
3. npm install
4. npm run migrate     (creates the application tables; safe to repeat)
5. npm run dev         (restarts by itself when you change code)

Check it works: open http://localhost:5000/api/health  ->  {"ok":true,"database":"connected"}

Account signup and login do not require email delivery. Password recovery and
email changes are currently unavailable. Users can change their password while
logged in by entering their current password.

## API (all under /api, JSON, send "Authorization: ******" after login)
Auth       POST /auth/signup  /auth/login
Me         GET /me  PATCH /me  GET /me/summary  POST /me/password  DELETE /me
Settings   GET /me/settings  PUT /me/settings
Movies     GET /movies/search?q=
Entries    GET /entries  GET /entries/pending  POST /entries  GET /entries/:id  PUT /entries/:id/review  DELETE /entries/:id
Waitlist   GET /waitlist  POST /waitlist  DELETE /waitlist/:movieId
Friends    GET /friends  GET /friends/search?q=  POST /friends/request  POST /friends/:id/accept  POST /friends/:id/decline  DELETE /friends/:userId
Notifs     GET /notifications  POST /notifications/read-all  POST /notifications/:id/read
Contact    POST /contact

See the repository's [deployment checklist](../DEPLOYMENT.md) for production
environment variables, database migration, and separate frontend/backend hosting.
