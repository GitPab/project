import type { Pool } from 'pg';
import { logger } from './logger';

interface PoolMetrics {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  maxConnections: number;
}

export class ConnectionPoolMonitor {
  private pool: Pool;
  private metrics: PoolMetrics = {
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
    maxConnections: 0,
  };
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(pool: Pool) {
    this.pool = pool;
    this.metrics.maxConnections = (pool.options as any).max || 20;
    
    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
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

    this.pool.on('error', (err: Error) => {
      logger.error('Unexpected pool error', err);
    });
  }

  private updateMetrics(): void {
    this.metrics = {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: this.metrics.maxConnections,
    };
  }

  public startMonitoring(intervalMs: number = 30000): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.updateMetrics();
      this.logMetrics();
      this.checkHealth();
    }, intervalMs);

    logger.info('Connection pool monitoring started', { interval: `${intervalMs}ms` });
  }

  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Connection pool monitoring stopped');
    }
  }

  private logMetrics(): void {
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

    // Alert on high utilization
    if (utilizationPercent > 80) {
      logger.warn('High connection pool utilization', {
        utilization: `${utilizationPercent.toFixed(1)}%`,
        recommendation: 'Consider increasing pool size or optimizing queries',
      });
    }

    // Alert on waiting clients
    if (waitingCount > 5) {
      logger.warn('Clients waiting for connections', {
        waitingCount,
        recommendation: 'Possible connection leak or insufficient pool size',
      });
    }
  }

  private checkHealth(): void {
    // Check for connection leaks (connections held too long)
    if (this.metrics.totalCount - this.metrics.idleCount > this.metrics.maxConnections * 0.9) {
      logger.warn('Potential connection leak detected', {
        activeConnections: this.metrics.totalCount - this.metrics.idleCount,
        threshold: this.metrics.maxConnections * 0.9,
      });
    }
  }

  public getMetrics(): PoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  public async testConnection(): Promise<boolean> {
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

// Query performance monitor
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
}

export class QueryMonitor {
  private slowQueryThreshold = 1000; // ms
  private recentQueries: QueryMetrics[] = [];
  private maxRecentQueries = 100;

  public recordQuery(query: string, duration: number): void {
    const metrics: QueryMetrics = {
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

  private sanitizeQuery(query: string): string {
    // Remove sensitive data and truncate
    return query
      .replace(/\$\d+/g, '?') // Replace parameterized values
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 200); // Truncate
  }

  public getSlowQueries(minDuration: number = 1000): QueryMetrics[] {
    return this.recentQueries.filter(q => q.duration >= minDuration);
  }

  public getStats(): { totalQueries: number; avgDuration: number; slowQueries: number } {
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

// Wrapper for pool.query with monitoring
export function createMonitoredPool(pool: Pool, queryMonitor: QueryMonitor): Pool {
  const originalQuery = pool.query.bind(pool);

  (pool as any).query = async (text: string, params?: any[]) => {
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
        error: (error as Error).message,
      });
      throw error;
    }
  };

  return pool;
}
