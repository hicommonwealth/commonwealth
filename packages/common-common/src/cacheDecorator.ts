import { RequestHandler } from 'express';
import { RedisNamespaces } from './types';
import { RedisCache } from './redisCache';

class CacheDecorator {

    private redisCache: RedisCache;

    constructor() {
    }

    public setCache(redisCache) {
        this.redisCache = redisCache;
    }

    public cache(duration, key=undefined, namespace:RedisNamespaces=RedisNamespaces.Route_Response): RequestHandler {
        const that = this;
        return async function cacheMiddleware(req, res, next) {
          const cacheKey = key || req.originalUrl;
          try {
            if(!that.redisCache)  {
                next();
                return;
            }
            // Try to fetch the response from Redis cache
            const cachedResponse = await that.redisCache.getKey(namespace, cacheKey);
            if (cachedResponse) {
              // Response found in cache, send it
              res.send(JSON.parse(cachedResponse));
              return;
            }
      
            // Response not found in cache, generate it and cache it
            const originalSend = res.send;
            res.send = (body) => {
              that.redisCache.setKey(namespace, cacheKey, body, duration);
              return originalSend.call(res,body);
            };
            next();
          } catch (error) {
            console.error(error);
            next();
          }
        };
    }
}

export const cacheDecorator = new CacheDecorator();