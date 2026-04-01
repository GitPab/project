/**
 * Purge old audit logs.
 *
 * Usage:
 *   AUDIT_RETENTION_DAYS=180 node scripts/purge-audit.mjs
 *   AUDIT_RETENTION_DAYS=180 AUDIT_PURGE_DRY_RUN=true node scripts/purge-audit.mjs
 */

import { getPool } from '../server/dbAdapter.js';

const RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS || '180', 10);
const DRY_RUN = (process.env.AUDIT_PURGE_DRY_RUN || 'false').toLowerCase() === 'true';
const DB_TYPE = process.env.DB_TYPE || 'postgresql';

async function run() {
  if (!Number.isFinite(RETENTION_DAYS) || RETENTION_DAYS <= 0) {
    console.error('[audit-purge] Invalid AUDIT_RETENTION_DAYS');
    process.exit(1);
  }

  const pool = await getPool();

  if (DRY_RUN) {
    const count = await getCount(pool);
    console.log(`[audit-purge] dry run: ${count} row(s) older than ${RETENTION_DAYS} days`);
    return;
  }

  const deleted = await deleteOld(pool);
  console.log(`[audit-purge] deleted ${deleted} row(s) older than ${RETENTION_DAYS} days`);
}

async function getCount(pool) {
  if (DB_TYPE === 'mysql') {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [RETENTION_DAYS]
    );
    return rows?.[0]?.count || 0;
  }

  const result = await pool.query(
    'SELECT COUNT(*) as count FROM audit_logs WHERE created_at < NOW() - ($1 * INTERVAL \'1 day\')',
    [RETENTION_DAYS]
  );
  return result?.rows?.[0]?.count || 0;
}

async function deleteOld(pool) {
  if (DB_TYPE === 'mysql') {
    const [result] = await pool.execute(
      'DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [RETENTION_DAYS]
    );
    return result?.affectedRows || 0;
  }

  const result = await pool.query(
    'DELETE FROM audit_logs WHERE created_at < NOW() - ($1 * INTERVAL \'1 day\')',
    [RETENTION_DAYS]
  );
  return result?.rowCount || 0;
}

run().catch((err) => {
  console.error('[audit-purge] failed:', err.message);
  process.exit(1);
});
