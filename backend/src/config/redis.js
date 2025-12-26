import { createClient } from 'redis';

// Redis client instance
let redisClient = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection
 * Falls back gracefully if Redis is not available
 */
export async function initRedis() {
  try {
    // Only attempt Redis connection if URL is provided
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;

    if (!redisUrl) {
      console.log('⚠️  Redis URL not configured. Running without cache.');
      isRedisAvailable = false;
      return null;
    }

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('❌ Redis connection failed after 3 retries');
            isRedisAvailable = false;
            return false; // Stop reconnecting
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready to use');
      isRedisAvailable = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    isRedisAvailable = false;
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient() {
  return isRedisAvailable ? redisClient : null;
}

/**
 * Check if Redis is available
 */
export function isRedisReady() {
  return isRedisAvailable && redisClient?.isOpen;
}

/**
 * Set a value in Redis with TTL
 */
export async function setCache(key, value, ttlSeconds = 3600) {
  if (!isRedisReady()) {
    return false;
  }

  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.setEx(key, ttlSeconds, stringValue);
    return true;
  } catch (error) {
    console.error('Redis setCache error:', error);
    return false;
  }
}

/**
 * Get a value from Redis
 */
export async function getCache(key) {
  if (!isRedisReady()) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
}

/**
 * Delete a value from Redis
 */
export async function deleteCache(key) {
  if (!isRedisReady()) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis deleteCache error:', error);
    return false;
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function deleteCachePattern(pattern) {
  if (!isRedisReady()) {
    return false;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Redis deleteCachePattern error:', error);
    return false;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  }
}

export default {
  initRedis,
  getRedisClient,
  isRedisReady,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  closeRedis,
};
