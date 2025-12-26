import { getCache, setCache, isRedisReady } from '../config/redis.js';

/**
 * Cache middleware for API routes
 * Caches GET requests only
 *
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
 * @param {function} keyGenerator - Optional custom key generator function
 */
export function cacheMiddleware(ttl = 3600, keyGenerator = null) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if Redis is not available
    if (!isRedisReady()) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator
        ? keyGenerator(req)
        : generateCacheKey(req);

      // Try to get from cache
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`⚠️  Cache MISS: ${cacheKey}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = (data) => {
        // Cache successful responses only
        if (res.statusCode === 200) {
          setCache(cacheKey, data, ttl).catch(err => {
            console.error('Error caching response:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req) {
  const baseUrl = req.originalUrl || req.url;
  const userId = req.user?.id || 'guest';

  // Include query params in cache key
  return `api:${userId}:${baseUrl}`;
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern) {
  if (!isRedisReady()) {
    return;
  }

  const { deleteCachePattern } = await import('../config/redis.js');
  await deleteCachePattern(pattern);
}

/**
 * Invalidate user-specific cache
 */
export async function invalidateUserCache(userId) {
  await invalidateCache(`api:${userId}:*`);
}

/**
 * Pre-configured cache middleware for common use cases
 */
export const cache = {
  // Short cache (5 minutes) - for frequently changing data
  short: cacheMiddleware(300),

  // Medium cache (30 minutes) - for semi-static data
  medium: cacheMiddleware(1800),

  // Long cache (1 hour) - for static data
  long: cacheMiddleware(3600),

  // Extended cache (24 hours) - for rarely changing data
  extended: cacheMiddleware(86400),
};

export default cacheMiddleware;
