import { cache } from '@hicommonwealth/core';
import { CacheNamespaces } from '@hicommonwealth/shared';

// Rate Limiter Middleware Function
type RateLimiterOptions = {
  routerNamespace: string;
  requestsPerMinute: number;
};

const getClientIp = (req) => {
  return (
    req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']
  );
};

export function rateLimiterMiddleware({
  routerNamespace,
  requestsPerMinute,
}: RateLimiterOptions) {
  return async (req, res, next) => {
    const cacheKey = `${routerNamespace}-${getClientIp(req)}`;

    try {
      const requestCount = await cache().incrementKey(
        CacheNamespaces.Rate_Limiter,
        cacheKey,
      );

      if (requestCount === 1) {
        // is first request in window, set expiration
        await cache().setKeyTTL(CacheNamespaces.Rate_Limiter, cacheKey, 60);
      }

      if (requestCount > requestsPerMinute) {
        const ttl = await cache().getKeyTTL(
          CacheNamespaces.Rate_Limiter,
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
