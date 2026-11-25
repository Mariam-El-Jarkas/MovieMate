import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

// Runs every .sql file in /migrations once (in order). Safe to run again.
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
const done = new Set((await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
  if (done.has(f)) { console.log('skip ', f); continue; }
  await pool.query(fs.readFileSync(path.join(dir, f), 'utf8'));
  await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
  console.log('apply', f);
}
await pool.end();
console.log('Migrations done.');
