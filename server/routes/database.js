/**
 * Database Management Routes
 * Sync, backup, optimize database operations
 */

import express from 'express';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { logAudit } from '../utils/audit.js';
import { requirePermission } from '../utils/rbac.js';
import { DatabaseSync } from '../dbSync.js';
import { DatabaseOptimizer } from '../dbOptimizer.js';
import autoSyncManager from '../autoSync.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

/**
 * POST /api/admin/db/sync
 * Sync data between PostgreSQL and MySQL
 */
router.post('/sync', requirePermission('manage', 'database'), async (req, res) => {
  const { direction = 'bidirectional', tables = ['users', 'universities', 'registrations'] } = req.body;
  
  try {
    const pgUrl = process.env.PG_SYNC_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sacma';
    const mysqlConfig = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'sacma'
    };
    
    const sync = new DatabaseSync(pgUrl, mysqlConfig);
    let result;
    
    switch (direction) {
      case 'to-mysql':
        result = await sync.syncPgToMySQL({ 
          users: tables.includes('users'), 
          universities: tables.includes('universities'), 
          registrations: tables.includes('registrations') 
        });
        break;
      case 'to-postgres':
      case 'to-pg':
        result = await sync.syncMySQLToPg({ 
          users: tables.includes('users'), 
          universities: tables.includes('universities'), 
          registrations: tables.includes('registrations') 
        });
        break;
      case 'bidirectional':
      default:
        result = await sync.syncBidirectional();
        break;
    }
    
    await sync.close();
    
    await logAudit(req, 'SYNC', 'database', null, { direction, tables }, result);
    logger.info('Database sync completed', { direction, userId: req.user.id });
    
    res.json({ success: true, direction, result, message: 'Database sync completed' });
  } catch (error) {
    logger.error('Database sync failed', { error: error.message, direction });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/db/optimize
 * Run database optimization
 */
router.post('/optimize', requirePermission('manage', 'database'), async (req, res) => {
  try {
    const optimizer = new DatabaseOptimizer();
    const report = await optimizer.runFullOptimization();
    
    await logAudit(req, 'OPTIMIZE', 'database', null, null, { indexesApplied: report.appliedIndexes?.applied || 0 });
    logger.info('Database optimization completed', { userId: req.user.id });
    
    res.json({ success: true, report, message: 'Database optimization completed' });
  } catch (error) {
    logger.error('Database optimization failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/db/backup
 * Create database backup
 */
router.post('/backup', requirePermission('manage', 'database'), async (req, res) => {
  const { filename } = req.body;
  
  try {
    const pgUrl = process.env.PG_SYNC_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sacma';
    const mysqlConfig = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'sacma'
    };
    
    const sync = new DatabaseSync(pgUrl, mysqlConfig);
    const result = await sync.exportToFile(filename || `backup-${Date.now()}.json`);
    await sync.close();
    
    await logAudit(req, 'BACKUP', 'database', null, null, { filename: result.filepath });
    logger.info('Database backup created', { filename: result.filepath, userId: req.user.id });
    
    res.json({ success: true, ...result, message: 'Database backup created' });
  } catch (error) {
    logger.error('Database backup failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/db/restore
 * Restore database from backup
 */
router.post('/restore', requirePermission('manage', 'database'), async (req, res) => {
  const { filename, confirm } = req.body;
  
  if (!confirm) {
    return res.status(400).json({ success: false, error: 'Must set confirm: true to restore database' });
  }
  
  try {
    const pgUrl = process.env.PG_SYNC_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sacma';
    const mysqlConfig = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'sacma'
    };
    
    const sync = new DatabaseSync(pgUrl, mysqlConfig);
    const result = await sync.importFromFile(filename);
    await sync.close();
    
    await logAudit(req, 'RESTORE', 'database', null, null, { filename, imported: result.imported });
    logger.info('Database restored', { filename, userId: req.user.id });
    
    res.json({ success: true, result, message: 'Database restored successfully' });
  } catch (error) {
    logger.error('Database restore failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/db/stats
 * Get database statistics
 */
router.get('/stats', requirePermission('view', 'analytics'), async (req, res) => {
  try {
    const optimizer = new DatabaseOptimizer();
    const stats = await optimizer.getTableStats();
    const tips = await optimizer.getQueryOptimizationTips();
    const DB_TYPE = process.env.DB_TYPE || 'postgresql';
    
    res.json({ success: true, database: DB_TYPE, stats, optimizationTips: tips });
  } catch (error) {
    logger.error('Failed to get database stats', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/db/list-backups
 * List available backups
 */
router.get('/list-backups', requirePermission('view', 'database'), async (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    let files = [];
    try {
      const entries = await fs.readdir(backupDir, { withFileTypes: true });
      const jsonFiles = entries.filter(e => e.isFile() && e.name.endsWith('.json'));
      
      for (const e of jsonFiles) {
        const stat = await fs.stat(path.join(backupDir, e.name));
        files.push({
          name: e.name,
          size: stat.size,
          created: stat.ctime
        });
      }
      
      files.sort((a, b) => b.created - a.created);
    } catch (e) {
      // Directory doesn't exist
    }
    
    res.json({ success: true, backups: files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auto-sync status endpoint
router.get('/sync/status', requirePermission('view', 'database'), async (req, res) => {
  try {
    const status = autoSyncManager.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger immediate sync
router.post('/sync/trigger', requirePermission('manage', 'database'), async (req, res) => {
  try {
    const { direction = 'mysql-to-postgres' } = req.body;
    const result = await autoSyncManager.performSync(direction);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
