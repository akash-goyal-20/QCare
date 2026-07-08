const { redis } = require('../config/redis');

/**
 * Sliding window rate limiter using Redis sorted sets
 * @param {number} limit - max requests allowed in window
 * @param {number} windowSeconds - window size in seconds
 */
const rateLimiter = (limit = 10, windowSeconds = 60) => {
  return async (req, res, next) => {
    // Use userId if authenticated, else fallback to IP
    const identifier = req.user?.id || req.ip;
    const endpoint = req.path;
    const key = `rate:${identifier}:${endpoint}`;

    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    try {
      // Pipeline for atomic operations
      const pipeline = redis.pipeline();

      // 1. Remove entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);

      // 2. Count entries in current window
      pipeline.zcard(key);

      // 3. Add current request timestamp
      pipeline.zadd(key, now, String(now));

      // 4. Set key expiry (auto cleanup)
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();
      const currentCount = results[1][1]; // zcard result

      // Set rate limit headers (good practice)
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentCount - 1));
      res.setHeader('X-RateLimit-Window', windowSeconds);

      if (currentCount >= limit) {
        return res.status(429).json({
          error: 'Too many requests. Please try again in a minute.',
          retryAfter: windowSeconds,
        });
      }

      next();
    } catch (err) {
      console.error('Rate limiter error:', err);
      // Fail open — if Redis is down, let request through
      next();
    }
  };
};

module.exports = rateLimiter;
