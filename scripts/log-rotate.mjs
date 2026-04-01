/**
 * Log rotation helper
 *
 * Usage:
 *   LOG_DIR=logs LOG_RETENTION_DAYS=14 LOG_RETENTION_COUNT=20 LOG_RETENTION_SIZE_MB=500 node scripts/log-rotate.mjs
 */

const LOG_DIR = process.env.LOG_DIR || 'logs';
const RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '14', 10);
const RETENTION_COUNT = parseInt(process.env.LOG_RETENTION_COUNT || '20', 10);
const RETENTION_SIZE_MB = parseInt(process.env.LOG_RETENTION_SIZE_MB || '0', 10);

async function run() {
  const { readdir, stat, unlink } = await import('fs/promises');
  const path = await import('path');

  let entries = [];
  try {
    entries = await readdir(LOG_DIR, { withFileTypes: true });
  } catch {
    console.log('[log-rotate] log dir not found, skipping');
    return;
  }

  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(LOG_DIR, entry.name);
    const info = await stat(filePath);
    files.push({ filePath, mtimeMs: info.mtimeMs, size: info.size });
  }

  let removedByAge = 0;
  if (Number.isFinite(RETENTION_DAYS) && RETENTION_DAYS > 0) {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    for (const file of files.slice()) {
      if (file.mtimeMs < cutoff) {
        await unlink(file.filePath);
        removedByAge++;
      }
    }
  }

  // Refresh after deletions
  const filesAfterAge = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(LOG_DIR, entry.name);
    try {
      const info = await stat(filePath);
      filesAfterAge.push({ filePath, mtimeMs: info.mtimeMs, size: info.size });
    } catch {
      // ignore
    }
  }

  let removedByCount = 0;
  if (Number.isFinite(RETENTION_COUNT) && RETENTION_COUNT > 0) {
    filesAfterAge.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const toDelete = filesAfterAge.slice(RETENTION_COUNT);
    for (const file of toDelete) {
      await unlink(file.filePath);
      removedByCount++;
    }
  }

  // Refresh after count deletion
  const filesAfterCount = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(LOG_DIR, entry.name);
    try {
      const info = await stat(filePath);
      filesAfterCount.push({ filePath, mtimeMs: info.mtimeMs, size: info.size });
    } catch {
      // ignore
    }
  }

  let removedBySize = 0;
  if (Number.isFinite(RETENTION_SIZE_MB) && RETENTION_SIZE_MB > 0) {
    const sizeLimit = RETENTION_SIZE_MB * 1024 * 1024;
    filesAfterCount.sort((a, b) => b.mtimeMs - a.mtimeMs);
    let total = filesAfterCount.reduce((acc, f) => acc + f.size, 0);
    for (const file of filesAfterCount.slice()) {
      if (total <= sizeLimit) break;
      await unlink(file.filePath);
      total -= file.size;
      removedBySize++;
    }
  }

  console.log('[log-rotate] summary:', { removedByAge, removedByCount, removedBySize });
}

run().catch((err) => {
  console.error('[log-rotate] failed:', err.message);
  process.exit(1);
});
