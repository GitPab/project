import { createClient } from 'redis';
import { logger } from './logger.js';

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis max reconnection attempts reached');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));
redisClient.on('reconnecting', () => logger.info('Redis Client Reconnecting'));

// Connect to Redis
export async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
  }
}

// Cache middleware for Express routes
export function cacheMiddleware(ttlSeconds = 300) {
  return async (req, res, next) => {
    if (!redisClient.isOpen) {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl || req.url}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        return res.json(JSON.parse(cached));
      }
      
      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(data)).catch((err) => {
          logger.error('Cache set error', err);
        });
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', error);
      next();
    }
  };
}

// Manual cache operations
export const cache = {
  async get(key) {
    if (!redisClient.isOpen) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  },

  async del(key) {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  },

  async delPattern(pattern) {
    if (!redisClient.isOpen) return;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error });
    }
  },

  // Invalidate cache for universities
  async invalidateUniversities() {
    await this.delPattern('cache:/api/universities*');
    await this.del('universities:all');
  },
};

// Graceful shutdown
export async function disconnectRedis() {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis Client Disconnected');
  }
}

export { redisClient };
