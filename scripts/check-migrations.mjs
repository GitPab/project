/**
 * Migration linter
 *
 * Ensures each migration exports an "up" function.
 */

import { readdir } from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '..', 'server', 'migrations');

async function run() {
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.js'))
    .sort();

  if (files.length === 0) {
    console.log('[migrations] no migration files found');
    return;
  }

  let hasErrors = false;

  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(migrationsDir, file)).href);
    if (!mod?.up || typeof mod.up !== 'function') {
      console.error(`[migrations] ${file} missing exported "up" function`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    process.exit(1);
  }
  console.log(`[migrations] ok (${files.length} file(s))`);
}

run().catch((err) => {
  console.error('[migrations] failed:', err.message);
  process.exit(1);
});
