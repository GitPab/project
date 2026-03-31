import { DatabaseSync } from './dbSync.js';
import { logger } from './logger.js';

/**
 * Automatic database synchronization manager
 * Supports time-based and trigger-based sync
 */
class AutoSyncManager {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
    this.lastSync = null;
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastError: null
    };
  }

  /**
   * Start automatic sync based on configuration
   */
  start() {
    const enabled = process.env.AUTO_SYNC_ENABLED === 'true';
    const intervalMinutes = parseInt(process.env.AUTO_SYNC_INTERVAL_MINUTES || '5', 10);
    
    if (!enabled) {
      logger.info('Auto-sync is disabled. Set AUTO_SYNC_ENABLED=true to enable.');
      return;
    }

    if (this.syncInterval) {
      logger.warn('Auto-sync already running');
      return;
    }

    logger.info(`Starting automatic sync every ${intervalMinutes} minutes`);
    
    // Run initial sync
    this.performSync();
    
    // Schedule recurring sync
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic sync
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Auto-sync stopped');
    }
  }

  /**
   * Perform a single sync operation
   */
  async performSync(direction = 'mysql-to-postgres') {
    if (this.isSyncing) {
      logger.warn('Sync already in progress, skipping...');
      return { success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;
    logger.info(`Starting automatic sync: ${direction}`);

    try {
      const pgUrl = process.env.PG_SYNC_URL || process.env.DATABASE_URL || 'postgresql://postgres:savethissacma-db@localhost:5432/sacma';
      const mysqlConfig = {
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'Admin@1234',
        database: process.env.MYSQL_DATABASE || 'sacma'
      };
      
      const syncer = new DatabaseSync(pgUrl, mysqlConfig);
      
      // Get source and target pools
      const mysqlPool = await this.getMySQLPool();
      const pgPool = await this.getPostgreSQLPool();
      
      if (!mysqlPool || !pgPool) {
        throw new Error('Database pools not available for sync');
      }

      let result;
      if (direction === 'mysql-to-postgres') {
        result = await syncer.syncMySQLToPg({ users: true, universities: true, registrations: true });
      } else {
        result = await syncer.syncPgToMySQL({ users: true, universities: true, registrations: true });
      }

      this.lastSync = new Date();
      this.stats.totalSyncs++;
      this.stats.successfulSyncs++;
      
      logger.info('Automatic sync completed successfully', {
        direction,
        duration: result.duration,
        tables: result.tables?.length || 0
      });

      return { success: true, result };
    } catch (error) {
      this.stats.totalSyncs++;
      this.stats.failedSyncs++;
      this.stats.lastError = error.message;
      
      logger.error('Automatic sync failed', {
        error: error.message,
        direction
      });

      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Trigger sync after a data change (debounced)
   */
  async triggerSync(entityType, entityId, action) {
    const triggerEnabled = process.env.AUTO_SYNC_TRIGGER_ENABLED !== 'false';
    if (!triggerEnabled) return;

    // Debounce: wait 5 seconds after last change before syncing
    if (this.triggerTimeout) {
      clearTimeout(this.triggerTimeout);
    }

    this.triggerTimeout = setTimeout(() => {
      logger.info(`Triggering sync after ${action} on ${entityType}:${entityId}`);
      this.performSync('mysql-to-postgres');
    }, 5000);
  }

  /**
   * Get MySQL pool from adapter
   */
  async getMySQLPool() {
    const { getPool } = await import('./dbAdapter.js');
    return getPool('mysql');
  }

  /**
   * Get PostgreSQL pool from adapter
   */
  async getPostgreSQLPool() {
    const { getPool } = await import('./dbAdapter.js');
    return getPool('postgresql');
  }

  /**
   * Get sync status and statistics
   */
  getStatus() {
    return {
      isRunning: !!this.syncInterval,
      isSyncing: this.isSyncing,
      lastSync: this.lastSync,
      stats: this.stats,
      config: {
        enabled: process.env.AUTO_SYNC_ENABLED === 'true',
        intervalMinutes: parseInt(process.env.AUTO_SYNC_INTERVAL_MINUTES || '5', 10),
        triggerEnabled: process.env.AUTO_SYNC_TRIGGER_ENABLED !== 'false'
      }
    };
  }
}

// Export singleton instance
export const autoSyncManager = new AutoSyncManager();
export default autoSyncManager;
