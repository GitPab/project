/**
 * Health Check Route
 * Server and database health status
 */

import express from 'express';
import { getPool } from '../dbAdapter.js';
import { logger } from '../logger.js';
import { redisClient } from '../cache.js';

const router = express.Router();

/**
 * GET /api/health
 * Basic health check
 */
router.get('/health', async (req, res) => {
  const DB_TYPE = process.env.DB_TYPE || 'postgresql';
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      type: DB_TYPE,
      connected: false
    },
    services: {
      supabase: !!process.env.SUPABASE_URL,
      redis: {
        connected: false
      },
    },
    alerts: {
      telegram: {
        configured: !!process.env.ALERT_TELEGRAM_BOT_TOKEN && !!process.env.ALERT_TELEGRAM_CHAT_ID
      },
      email: {
        configured:
          !!process.env.ALERT_EMAIL_TO &&
          !!process.env.ALERT_EMAIL_FROM &&
          !!process.env.SMTP_HOST
      },
      throttleMinutes: {
        global: parseInt(process.env.ALERT_THROTTLE_MINUTES || '30', 10),
        telegram: parseInt(process.env.ALERT_THROTTLE_TELEGRAM_MINUTES || '0', 10),
        email: parseInt(process.env.ALERT_THROTTLE_EMAIL_MINUTES || '0', 10)
      }
    },
    environment: process.env.NODE_ENV || 'development'
  };
  
  try {
    const pool = await getPool();
    await pool.query('SELECT 1');
    health.database.connected = true;
  } catch (err) {
    health.status = 'degraded';
    health.database.error = err.message;
    logger.error('Health check: Database connection failed', err);
  }

  try {
    if (redisClient?.isOpen) {
      const pong = await redisClient.ping();
      health.services.redis.connected = pong === 'PONG';
    } else {
      health.services.redis.connected = false;
    }
  } catch (err) {
    health.services.redis.connected = false;
    health.services.redis.error = err.message;
    health.status = 'degraded';
    logger.error('Health check: Redis ping failed', err);
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /api/test-db-connection
 * Detailed database connection test
 */
router.get('/test-db-connection', async (req, res) => {
  const startTime = Date.now();
  const DB_TYPE = process.env.DB_TYPE || 'postgresql';
  
  try {
    const pool = await getPool();
    
    // Test basic connection
    await pool.query('SELECT 1');
    
    // Test actual table query
    const { rows: tables } = await pool.query(
      DB_TYPE === 'mysql' 
        ? "SHOW TABLES"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    // Test users table
    const { rows: userCount } = await pool.query(
      "SELECT COUNT(*) as count FROM users"
    );
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      database: DB_TYPE,
      responseTime: `${responseTime}ms`,
      tables: tables.length,
      userCount: userCount[0].count,
      message: 'Database connection successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: DB_TYPE,
      error: error.message,
      message: 'Database connection failed'
    });
  }
});

export default router;
