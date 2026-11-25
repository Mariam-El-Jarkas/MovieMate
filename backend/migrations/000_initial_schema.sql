CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  avatar_url text,
  email_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique ON users (lower(username));

CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  purpose text NOT NULL,
  expires_at timestamptz NOT NULL,
  new_email text,
  attempts integer NOT NULL DEFAULT 0,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_codes_user_purpose_idx ON otp_codes (user_id, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS movies (
  id bigserial PRIMARY KEY,
  tmdb_id bigint NOT NULL UNIQUE,
  title text NOT NULL,
  release_year integer,
  poster_path text,
  genres text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watch_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id bigint NOT NULL REFERENCES movies(id),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  watched_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS watch_entries_created_by_date_idx ON watch_entries (created_by, watched_on DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS entry_participants (
  entry_id uuid NOT NULL REFERENCES watch_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'tagged')),
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, user_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  entry_id uuid NOT NULL REFERENCES watch_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_type text NOT NULL CHECK (review_type IN ('quick', 'full')),
  overall numeric(3, 1) NOT NULL CHECK (overall >= 1 AND overall <= 10),
  story integer,
  acting integer,
  pacing integer,
  visuals integer,
  sound integer,
  writing integer,
  emotion integer,
  originality integer,
  rewatch integer,
  ending integer,
  tension integer,
  theme integer,
  note varchar(140),
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, user_id)
);
CREATE INDEX IF NOT EXISTS reviews_user_updated_idx ON reviews (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS waitlist (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id bigint NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (requester_id <> addressee_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_unique
  ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

CREATE TABLE IF NOT EXISTS badges (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  min_movies integer NOT NULL UNIQUE CHECK (min_movies > 0)
);
INSERT INTO badges (id, code, name, min_movies) VALUES
  ('1', 'watched_20', '20+ movies', 20),
  ('2', 'watched_50', '50+ movies', 50),
  ('3', 'watched_100', '100+ movies', 100)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS user_badges (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('tagged', 'friend_review', 'friend_request', 'friend_accepted', 'badge_earned')),
  entry_id uuid REFERENCES watch_entries(id) ON DELETE CASCADE,
  badge_id text REFERENCES badges(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notify_tagged boolean NOT NULL DEFAULT true,
  notify_friend_reviews boolean NOT NULL DEFAULT true,
  notify_friend_requests boolean NOT NULL DEFAULT true,
  notify_email boolean NOT NULL DEFAULT false,
  who_sees_movies text NOT NULL DEFAULT 'friends' CHECK (who_sees_movies IN ('friends', 'everyone', 'only_me')),
  who_can_tag text NOT NULL DEFAULT 'friends' CHECK (who_can_tag IN ('friends', 'everyone', 'nobody'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
