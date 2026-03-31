/**
 * Audit Logging Utility
 */

import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';

/**
 * Log an audit event
 */
export async function logAudit(req, action, entityType, entityId, oldValues, newValues) {
  try {
    const pool = await getPool();
    const DB_TYPE = process.env.DB_TYPE || 'postgresql';
    
    if (DB_TYPE === 'mysql') {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          req.user?.id || null,
          action,
          entityType,
          entityId,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          req.ip,
          req.headers['user-agent']
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          req.user?.id || null,
          action,
          entityType,
          entityId,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          req.ip,
          req.headers['user-agent']
        ]
      );
    }
  } catch (err) {
    logger.error('Audit log error', { error: err.message });
  }
}

/**
 * Log a simple event (without request object)
 */
export async function logEvent(action, entityType, entityId, details = {}) {
  try {
    logger.info('Audit Event', {
      action,
      entityType,
      entityId,
      ...details,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Event log error', { error: err.message });
  }
}
