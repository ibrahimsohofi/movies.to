import { getCache, setCache, deleteCache, deleteCachePattern, isRedisReady } from '../config/redis.js';

// Cache TTL presets (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
};

// Generate cache key from request
function generateCacheKey(req, prefix = '') {
  const baseKey = `${prefix}:${req.method}:${req.originalUrl}`;

  // Include user ID for personalized content
  if (req.user?.id) {
    return `user:${req.user.id}:${baseKey}`;
  }

  return `public:${baseKey}`;
}

/**
 * Cache middleware factory
 * @param {Object} options - Caching options
 * @param {number} options.ttl - Time to live in seconds
 * @param {string} options.prefix - Cache key prefix
 * @param {boolean} options.userSpecific - Whether cache is user-specific
 * @param {Function} options.keyGenerator - Custom key generator function
 * @param {Function} options.shouldCache - Function to determine if response should be cached
 */
export function cacheMiddleware(options = {}) {
  const {
    ttl = CACHE_TTL.MEDIUM,
    prefix = 'api',
    userSpecific = false,
    keyGenerator = null,
    shouldCache = (req, res) => res.statusCode === 200,
  } = options;

  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if Redis is not available
    if (!isRedisReady()) {
      return next();
    }

    // Skip if cache bypass header is present
    if (req.headers['x-cache-bypass'] === 'true') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : generateCacheKey(req, prefix);

    try {
      // Try to get from cache
      const cached = await getCache(cacheKey);

      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.json(cached);
      }

      // Cache miss - store original json method
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = async (data) => {
        if (shouldCache(req, res)) {
          try {
            await setCache(cacheKey, data, ttl);
            res.setHeader('X-Cache-TTL', ttl.toString());
          } catch (cacheError) {
            console.error('Cache set error:', cacheError);
          }
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
 * Clear cache for a specific pattern
 */
export async function clearCache(pattern) {
  try {
    await deleteCachePattern(pattern);
    return true;
  } catch (error) {
    console.error('Clear cache error:', error);
    return false;
  }
}

/**
 * Clear user-specific cache
 */
export async function clearUserCache(userId, type = '*') {
  try {
    await deleteCachePattern(`user:${userId}:${type}:*`);
    return true;
  } catch (error) {
    console.error('Clear user cache error:', error);
    return false;
  }
}

/**
 * Cache invalidation middleware - clears cache after mutation
 */
export function invalidateCacheMiddleware(patterns = []) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // After successful response, invalidate cache
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          for (const pattern of patterns) {
            // Replace :userId with actual user ID if present
            const resolvedPattern = pattern.replace(':userId', req.user?.id || '*');
            await deleteCachePattern(resolvedPattern);
          }
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * TMDB response cache middleware
 */
export function tmdbCacheMiddleware(ttl = CACHE_TTL.HOUR) {
  return cacheMiddleware({
    ttl,
    prefix: 'tmdb',
    userSpecific: false,
    shouldCache: (req, res) => res.statusCode === 200,
  });
}

/**
 * User recommendations cache middleware
 */
export function recommendationsCacheMiddleware(ttl = CACHE_TTL.MEDIUM) {
  return cacheMiddleware({
    ttl,
    prefix: 'recommendations',
    userSpecific: true,
    shouldCache: (req, res) => res.statusCode === 200,
  });
}

/**
 * Cache statistics
 */
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
};

export function getCacheStats() {
  const total = cacheStats.hits + cacheStats.misses;
  return {
    ...cacheStats,
    hitRate: total > 0 ? (cacheStats.hits / total * 100).toFixed(2) + '%' : '0%',
    total,
    redisAvailable: isRedisReady(),
  };
}

export function resetCacheStats() {
  cacheStats = { hits: 0, misses: 0, errors: 0 };
}

/**
 * Cache stats tracking middleware
 */
export function trackCacheStats(req, res, next) {
  const cacheHeader = res.getHeader('X-Cache');
  if (cacheHeader === 'HIT') {
    cacheStats.hits++;
  } else if (cacheHeader === 'MISS') {
    cacheStats.misses++;
  }
  next();
}

export default {
  cacheMiddleware,
  clearCache,
  clearUserCache,
  invalidateCacheMiddleware,
  tmdbCacheMiddleware,
  recommendationsCacheMiddleware,
  getCacheStats,
  resetCacheStats,
  trackCacheStats,
  CACHE_TTL,
};
