# MovieMate deployment checklist

## 1. Provision production services

- Create a PostgreSQL database for production. Do not point the deployed app at
  the local `moviemate` database.
- Deploy the Node backend from the `backend` directory on a Node.js host.
- Deploy the Vite frontend from the `Frontend` directory on a static frontend
  host, or serve it behind the same origin as the backend.
- Keep credentials in each provider's environment-variable settings, never in
  source code or frontend variables.

## 2. Configure the backend environment

Use `backend/.env.example` as the variable reference. In the backend host's
environment settings, configure:

- `NODE_ENV=production`
- `DATABASE_URL` with the production PostgreSQL connection string.
- Set `DB_SSL=true` for Neon or another provider requiring TLS; certificate
  verification remains enabled. Use `false` only for local PostgreSQL without
  TLS.
- `JWT_SECRET` as a unique random value of at least 32 characters. Generate one
  locally with:

  ```sh
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- `TMDB_API_KEY` from The Movie Database.
- `CLIENT_URL` as the frontend's exact HTTPS origin, with no trailing slash.
  Multiple origins may be comma-separated.
- `PORT` only if the host does not supply it automatically.

The backend refuses to start in production if required configuration is missing,
the JWT secret looks like a placeholder, or `CLIENT_URL` is not an HTTPS origin.
If `RESEND_API_KEY` is configured for optional outbound email notifications,
also set `MAIL_FROM` to a sender on a domain verified with Resend. Email is not
required for signup or login.

## 3. Migrate the production database

With the backend environment configured, run this once from the `backend`
directory against the production database:

```sh
npm run migrate
```

The migration runner is safe to rerun. It creates/updates the schema and removes
the obsolete OTP table and email-verification column.

## 4. Configure and deploy the frontend

Use `Frontend/.env.example` as the variable reference:

- If frontend and backend share an origin and `/api` is routed to the backend,
  leave `VITE_API_URL` blank.
- If they are hosted separately, set `VITE_API_URL` to the backend's HTTPS
  origin only, without `/api` or a trailing slash. For example:
  `https://your-api-host.example`.

Set this variable in the frontend host before building. It is included in the
browser bundle, so it must only contain the public API origin—never a secret.
Build with:

```sh
npm ci
npm run build
```

For a Vercel frontend and a separate Render backend, set `VITE_API_URL` to the
Render public HTTPS origin and set the backend's `CLIENT_URL` to the Vercel
site's HTTPS origin. Redeploy both services after changing their environment
variables.

## 5. Verify the deployment manually

1. Open `https://your-api-host.example/api/health`; expect
   `{"ok":true,"database":"connected"}`.
2. Create two accounts with different email strings; signup should log each user
   in without an email code.
3. Log out and back in with each account.
4. Change a password while logged in, then verify the new password works.
5. Search for the other account, send and accept a friend request.
6. Search for a movie, save a review, and check its post and notifications.
7. Check the production database's `contact_messages` table after submitting
   the contact form. Messages are stored there; they are not currently emailed
   or shown in an admin inbox.

Email verification, password recovery, and changing the login email are
currently unavailable. Signup accepts unverified email addresses. Users should
keep their passwords safe; changing a password requires knowing the current
one.

## 6. Operations

- Configure database backups with the database provider before real users add
  data.
- Keep the local database separate from production and do not load test accounts
  into the production database.
- No automated application test suite is configured yet; the manual checks
  above cover the main user flows.
