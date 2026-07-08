const { redis } = require('../config/redis');

const idempotency = async (req, res, next) => {
  const key = req.headers['idempotency-key'];

  if (!key) {
    return res.status(400).json({ error: 'Idempotency-Key header is required.' });
  }

  const redisKey = `idempotency:${key}`;

  try {
    const cached = await redis.get(redisKey);

    if (cached) {
      // Duplicate request — return cached response
      return res.status(200).json({
        ...JSON.parse(cached),
        _idempotent: true,   // flag so client knows this was a cached response
      });
    }

    // Store the key temporarily to block racing duplicates
    // Will be overwritten with full response after booking succeeds
    await redis.set(redisKey, JSON.stringify({ status: 'processing' }), 'EX', 86400);

    // Attach key to request for controller use
    req.idempotencyKey = key;
    req.idempotencyRedisKey = redisKey;

    next();
  } catch (err) {
    console.error('Idempotency middleware error:', err);
    next(); // fail open — let request through if Redis is down
  }
};

module.exports = idempotency;
