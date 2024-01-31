import { RedisCache } from '@hicommonwealth/adapters';
import { RedisNamespaces } from '@hicommonwealth/core';

// Rate Limiter Middleware Function
type RateLimiterOptions = {
  redisCache: RedisCache;
  routerNamespace: string;
  requestsPerMinute: number;
};

const getClientIp = (req) => {
  return (
    req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']
  );
};

export function rateLimiterMiddleware({
  redisCache,
  routerNamespace,
  requestsPerMinute,
}: RateLimiterOptions) {
  return async (req, res, next) => {
    const cacheKey = `${routerNamespace}-${getClientIp(req)}`;

    try {
      const requestCount = await redisCache.incrementKey(
        RedisNamespaces.Rate_Limiter,
        cacheKey,
      );

      if (requestCount === 1) {
        // is first request in window, set expiration
        await redisCache.setKeyTTL(RedisNamespaces.Rate_Limiter, cacheKey, 60);
      }

      if (requestCount > requestsPerMinute) {
        const ttl = await redisCache.getKeyTTL(
          RedisNamespaces.Rate_Limiter,
          cacheKey,
        );
        return res
          .status(429)
          .send(`Rate limit exceeded. Try again in ${ttl} seconds.`);
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      res.status(500).send('Internal Server Error');
    }
  };
}
