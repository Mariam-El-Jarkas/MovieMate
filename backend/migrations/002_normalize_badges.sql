INSERT INTO badges (id, code, name, min_movies) VALUES
  ('1', 'watched_20', '20+ movies', 20),
  ('2', 'watched_50', '50+ movies', 50),
  ('3', 'watched_100', '100+ movies', 100)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, min_movies = EXCLUDED.min_movies;

INSERT INTO user_badges (user_id, badge_id, earned_at)
SELECT earned.user_id, canonical.id, earned.earned_at
FROM user_badges earned
JOIN badges legacy ON legacy.id = earned.badge_id AND legacy.code IN ('20', '50', '100')
JOIN badges canonical ON canonical.code = 'watched_' || legacy.code
ON CONFLICT (user_id, badge_id) DO UPDATE
SET earned_at = LEAST(user_badges.earned_at, EXCLUDED.earned_at);

UPDATE notifications n
SET badge_id = canonical.id
FROM badges legacy
JOIN badges canonical ON canonical.code = 'watched_' || legacy.code
WHERE n.badge_id = legacy.id AND legacy.code IN ('20', '50', '100');

DELETE FROM badges WHERE code IN ('20', '50', '100');
