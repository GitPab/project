/**
 * Simple migration runner for PostgreSQL/MySQL.
 * Usage: node server/migrate.js
 */

import { readdir } from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';
import { getPool } from './dbAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');
const DB_TYPE = process.env.DB_TYPE || 'postgresql';

function toPostgresPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function query(pool, sql, params = []) {
  if (DB_TYPE === 'mysql') {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
  const pgSql = toPostgresPlaceholders(sql);
  const { rows } = await pool.query(pgSql, params);
  return rows;
}

async function ensureMigrationsTable(pool) {
  if (DB_TYPE === 'mysql') {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function loadMigrations() {
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.js'))
    .sort();
  return files.map((file) => ({
    name: file,
    path: path.join(migrationsDir, file),
  }));
}

async function run() {
  const pool = await getPool();
  await ensureMigrationsTable(pool);

  const appliedRows = await query(pool, 'SELECT name FROM schema_migrations');
  const applied = new Set(appliedRows.map((r) => r.name));

  const migrations = await loadMigrations();
  let appliedCount = 0;

  for (const migration of migrations) {
    if (applied.has(migration.name)) {
      continue;
    }

    const mod = await import(pathToFileURL(migration.path).href);
    if (!mod?.up || typeof mod.up !== 'function') {
      throw new Error(`Migration ${migration.name} missing exported 'up' function`);
    }

    await mod.up({ dbType: DB_TYPE, pool });
    await query(pool, 'INSERT INTO schema_migrations (name) VALUES (?)', [migration.name]);
    appliedCount++;
    console.log(`[migrate] applied ${migration.name}`);
  }

  console.log(`[migrate] done. Applied ${appliedCount} migration(s).`);
  if (DB_TYPE !== 'mysql') {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
