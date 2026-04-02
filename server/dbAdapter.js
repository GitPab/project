// Database Adapter - Supports both PostgreSQL and MySQL
import pkg from 'pg';
import { 
  createMySQLPool, 
  mysqlQuery, 
  initializeMySQLDatabase,
  closeMySQLPool 
} from './mysqlAdapter.js';
import { logger } from './logger.js';
import { ConnectionPoolMonitor, QueryMonitor } from './poolMonitor.js';

const { Pool: PgPool } = pkg;

// Database type from environment
const DB_TYPE = process.env.DB_TYPE || 'postgresql'; // 'postgresql' or 'mysql'

// PostgreSQL pool
let pgPool = null;
let pgMonitor = null;

// Create PostgreSQL pool
function createPgPool() {
  if (!pgPool) {
    pgPool = new PgPool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 15, // Under Render PostgreSQL 25 connection limit
      min: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    pgMonitor = new ConnectionPoolMonitor(pgPool);
    pgMonitor.startMonitoring(30000);
    
    logger.info('PostgreSQL pool created');
  }
  return pgPool;
}

// Database adapter object
export const db = {
  // Initialize database
  async initialize() {
    if (DB_TYPE === 'mysql') {
      await initializeMySQLDatabase();
    } else {
      // PostgreSQL initialization is in server.js
      createPgPool();
    }
  },

  // Execute query
  async query(text, params) {
    if (DB_TYPE === 'mysql') {
      return mysqlQuery(text, params);
    } else {
      const pool = createPgPool();
      return pool.query(text, params);
    }
  },

  // Get connection for transactions
  async connect() {
    if (DB_TYPE === 'mysql') {
      const pool = createMySQLPool();
      return pool.getConnection();
    } else {
      const pool = createPgPool();
      return pool.connect();
    }
  },

  // Get pool metrics (PostgreSQL only)
  getMetrics() {
    if (DB_TYPE === 'postgresql' && pgMonitor) {
      return pgMonitor.getMetrics();
    }
    return null;
  },

  // Graceful shutdown
  async end() {
    if (DB_TYPE === 'mysql') {
      await closeMySQLPool();
    } else if (pgPool) {
      pgMonitor?.stopMonitoring();
      await pgPool.end();
    }
  },

  // Get database type
  get type() {
    return DB_TYPE;
  }
};

// Export pool for direct access (backward compatibility)
export async function getPool() {
  if (DB_TYPE === 'mysql') {
    const pool = await createMySQLPool();
    // Return a proxy that has query() method for compatibility
    return {
      query: async (text, params) => {
        const [rows] = await pool.execute(text, params);
        return { rows };
      },
      execute: pool.execute.bind(pool),
      getConnection: pool.getConnection.bind(pool),
    };
  }
  return createPgPool();
}

export default db;
