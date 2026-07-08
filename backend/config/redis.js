const Redis = require('ioredis');

// General purpose client (get/set/zadd etc)
const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Publisher — used for redis.publish()
const redisPublisher = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Subscriber — used for redis.subscribe() (blocks other commands)
const redisSubscriber = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

module.exports = { redis, redisPublisher, redisSubscriber };
