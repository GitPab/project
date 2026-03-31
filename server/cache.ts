import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

// Redis client configuration
const redisClient: RedisClientType = createClient({
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
export async function connectRedis(): Promise<void> {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
  }
}

// Cache middleware for Express routes
export function cacheMiddleware(ttlSeconds: number = 300) {
  return async (req: any, res: any, next: any) => {
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
      res.json = (data: any) => {
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
  async get<T>(key: string): Promise<T | null> {
    if (!redisClient.isOpen) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  },

  async del(key: string): Promise<void> {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  },

  async delPattern(pattern: string): Promise<void> {
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
  async invalidateUniversities(): Promise<void> {
    await this.delPattern('cache:/api/universities*');
    await this.del('universities:all');
  },
};

// Graceful shutdown
export async function disconnectRedis(): Promise<void> {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis Client Disconnected');
  }
}

export { redisClient };
