/**
 * Daily backup helper
 *
 * Usage:
 *   BACKUP_API_URL=http://localhost:3001/api BACKUP_TOKEN=... node scripts/backup.mjs
 */

const API_URL = process.env.BACKUP_API_URL || 'http://localhost:3001/api';
const TOKEN = process.env.BACKUP_TOKEN;
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '14', 10);
const RETENTION_COUNT = parseInt(process.env.BACKUP_RETENTION_COUNT || '30', 10);
const RETENTION_SIZE_MB = parseInt(process.env.BACKUP_RETENTION_SIZE_MB || '0', 10);
const BACKUP_DIR = process.env.BACKUP_DIR || 'backups';
const RUN_SMOKE = (process.env.RUN_SMOKE_AFTER_BACKUP || 'true').toLowerCase() !== 'false';

if (!TOKEN) {
  console.error('[backup] Missing BACKUP_TOKEN');
  process.exit(1);
}

const now = new Date();
const dateStamp = now.toISOString().split('T')[0];
const filename = `backup-${dateStamp}.json`;

async function run() {
  try {
    const res = await fetch(`${API_URL}/admin/db/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ filename })
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText} ${text}`);
    }

    console.log('[backup] ok:', text);

    const removedByAge = await applyRetention();
    const removedByCount = await applyRetentionCount();
    const removedBySize = await applyRetentionSize();

    console.log('[backup] retention summary:', {
      removedByAge,
      removedByCount,
      removedBySize
    });

    if (RUN_SMOKE) {
      await runSmoke();
    }
  } catch (err) {
    await notifyFailure(err);
    throw err;
  }
}

run().catch((err) => {
  console.error('[backup] failed:', err.message);
  process.exit(1);
});

async function applyRetention() {
  if (!Number.isFinite(RETENTION_DAYS) || RETENTION_DAYS <= 0) {
    console.log('[backup] retention disabled');
    return;
  }

  const { readdir, stat, unlink } = await import('fs/promises');
  const path = await import('path');
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  let removed = 0;
  try {
    const entries = await readdir(BACKUP_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const filePath = path.join(BACKUP_DIR, entry.name);
      const info = await stat(filePath);
      if (info.mtimeMs < cutoff) {
        await unlink(filePath);
        removed++;
      }
    }
  } catch (err) {
    console.error('[backup] retention error:', err.message);
    return;
  }

  console.log(`[backup] retention removed ${removed} file(s) older than ${RETENTION_DAYS} days`);
  return removed;
}

async function applyRetentionCount() {
  if (!Number.isFinite(RETENTION_COUNT) || RETENTION_COUNT <= 0) {
    console.log('[backup] retention count disabled');
    return;
  }

  const { readdir, stat, unlink } = await import('fs/promises');
  const path = await import('path');

  let removed = 0;
  try {
    const entries = await readdir(BACKUP_DIR, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const filePath = path.join(BACKUP_DIR, entry.name);
      const info = await stat(filePath);
      files.push({ filePath, mtimeMs: info.mtimeMs });
    }

    files.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const toDelete = files.slice(RETENTION_COUNT);
    for (const file of toDelete) {
      await unlink(file.filePath);
      removed++;
    }
  } catch (err) {
    console.error('[backup] retention count error:', err.message);
    return;
  }

  console.log(`[backup] retention count removed ${removed} file(s), kept ${RETENTION_COUNT}`);
  return removed;
}

async function applyRetentionSize() {
  if (!Number.isFinite(RETENTION_SIZE_MB) || RETENTION_SIZE_MB <= 0) {
    console.log('[backup] retention size disabled');
    return;
  }

  const { readdir, stat, unlink } = await import('fs/promises');
  const path = await import('path');
  const sizeLimit = RETENTION_SIZE_MB * 1024 * 1024;

  let removed = 0;
  try {
    const entries = await readdir(BACKUP_DIR, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const filePath = path.join(BACKUP_DIR, entry.name);
      const info = await stat(filePath);
      files.push({ filePath, mtimeMs: info.mtimeMs, size: info.size });
    }

    files.sort((a, b) => b.mtimeMs - a.mtimeMs);
    let total = files.reduce((acc, f) => acc + f.size, 0);

    for (const file of files.slice(0)) {
      if (total <= sizeLimit) break;
      await unlink(file.filePath);
      total -= file.size;
      removed++;
    }
  } catch (err) {
    console.error('[backup] retention size error:', err.message);
    return;
  }

  console.log(`[backup] retention size removed ${removed} file(s), limit ${RETENTION_SIZE_MB}MB`);
  return removed;
}

async function runSmoke() {
  const { spawn } = await import('child_process');
  const path = await import('path');

  const scriptPath = path.join('scripts', 'smoke.mjs');
  console.log('[backup] running smoke tests...');

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      stdio: 'inherit',
      env: process.env
    });
    child.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`smoke tests failed with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function notifyFailure(err) {
  try {
    const { sendAlert } = await import('./notify.mjs');
    await sendAlert('Backup failed', err?.message || String(err), 'critical');
  } catch (notifyErr) {
    console.error('[backup] notify failed:', notifyErr.message);
  }
}
