import { logger } from './logger.js';

export class ConnectionPoolMonitor {
  constructor(pool) {
    this.pool = pool;
    this.metrics = {
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0,
      maxConnections: pool.options?.max || 20,
    };
    this.checkInterval = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.pool.on('connect', () => {
      logger.debug('New client connected to pool');
      this.updateMetrics();
    });

    this.pool.on('acquire', () => {
      logger.debug('Client acquired from pool');
      this.updateMetrics();
    });

    this.pool.on('remove', () => {
      logger.debug('Client removed from pool');
      this.updateMetrics();
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected pool error', err);
    });
  }

  updateMetrics() {
    this.metrics = {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: this.metrics.maxConnections,
    };
  }

  startMonitoring(intervalMs = 30000) {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.updateMetrics();
      this.logMetrics();
      this.checkHealth();
    }, intervalMs);

    logger.info('Connection pool monitoring started', { interval: `${intervalMs}ms` });
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Connection pool monitoring stopped');
    }
  }

  logMetrics() {
    const { totalCount, idleCount, waitingCount, maxConnections } = this.metrics;
    const utilizationPercent = ((totalCount - idleCount) / maxConnections) * 100;

    logger.info('Pool Metrics', {
      totalConnections: totalCount,
      idleConnections: idleCount,
      activeConnections: totalCount - idleCount,
      waitingClients: waitingCount,
      maxConnections,
      utilization: `${utilizationPercent.toFixed(1)}%`,
    });

    if (utilizationPercent > 80) {
      logger.warn('High connection pool utilization', {
        utilization: `${utilizationPercent.toFixed(1)}%`,
        recommendation: 'Consider increasing pool size or optimizing queries',
      });
    }

    if (waitingCount > 5) {
      logger.warn('Clients waiting for connections', {
        waitingCount,
        recommendation: 'Possible connection leak or insufficient pool size',
      });
    }
  }

  checkHealth() {
    if (this.metrics.totalCount - this.metrics.idleCount > this.metrics.maxConnections * 0.9) {
      logger.warn('Potential connection leak detected', {
        activeConnections: this.metrics.totalCount - this.metrics.idleCount,
        threshold: this.metrics.maxConnections * 0.9,
      });
    }
  }

  getMetrics() {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logger.error('Database connection test failed', error);
      return false;
    }
  }
}

export class QueryMonitor {
  constructor() {
    this.slowQueryThreshold = 1000;
    this.recentQueries = [];
    this.maxRecentQueries = 100;
  }

  recordQuery(query, duration) {
    const metrics = {
      query: this.sanitizeQuery(query),
      duration,
      timestamp: new Date(),
    };

    this.recentQueries.push(metrics);
    if (this.recentQueries.length > this.maxRecentQueries) {
      this.recentQueries.shift();
    }

    if (duration > this.slowQueryThreshold) {
      logger.warn('Slow query detected', {
        query: metrics.query,
        duration: `${duration}ms`,
        threshold: `${this.slowQueryThreshold}ms`,
      });
    }
  }

  sanitizeQuery(query) {
    return query
      .replace(/\$\d+/g, '?')
      .replace(/\s+/g, ' ')
      .substring(0, 200);
  }

  getSlowQueries(minDuration = 1000) {
    return this.recentQueries.filter(q => q.duration >= minDuration);
  }

  getStats() {
    if (this.recentQueries.length === 0) {
      return { totalQueries: 0, avgDuration: 0, slowQueries: 0 };
    }

    const totalDuration = this.recentQueries.reduce((sum, q) => sum + q.duration, 0);
    const slowQueries = this.recentQueries.filter(q => q.duration > this.slowQueryThreshold).length;

    return {
      totalQueries: this.recentQueries.length,
      avgDuration: Math.round(totalDuration / this.recentQueries.length),
      slowQueries,
    };
  }
}

export function createMonitoredPool(pool, queryMonitor) {
  const originalQuery = pool.query.bind(pool);

  pool.query = async (text, params) => {
    const start = Date.now();
    try {
      const result = await originalQuery(text, params);
      const duration = Date.now() - start;
      queryMonitor.recordQuery(text, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Query error', {
        query: text.substring(0, 200),
        duration: `${duration}ms`,
        error: error.message,
      });
      throw error;
    }
  };

  return pool;
}
