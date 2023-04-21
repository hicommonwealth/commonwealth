import { RequestHandler, Response, Send } from 'express';
import { RedisNamespaces } from './types';
import { RedisCache } from './redisCache';
import { ServerError } from 'common-common/src/errors';

export class CacheDecorator {
  private redisCache: RedisCache;
  constructor() {}

  public setCache(redisCache: RedisCache) {
    this.redisCache = redisCache;
  }

  public cache(duration: number, key: string = '', namespace: RedisNamespaces = RedisNamespaces.Route_Response): RequestHandler {
    const that = this;
    let t0 = performance.now();
    return async function cacheMiddleware(req, res, next) {
      const cacheKey = `${req.originalUrl}${key}`;
      try {
        if (!that.redisCache) {
          next();
          return;
        }
        // Try to fetch the response from Redis cache
        const cachedResponse = await that.redisCache.getKey(namespace, cacheKey);
        const t1 = performance.now();
        console.log(`Call to cache took ${t1 - t0} milliseconds.`);
        if (cachedResponse) {
          // Response found in cache, send it
          console.log('Response found in cache, sending it');
          res.set('X-Cache', 'HIT');
          res.send(JSON.parse(cachedResponse));
          return;
        }
        // Response not found in cache, generate it and cache it
        // Response not found in cache, generate it and cache it
        const originalSend = res.send;
        res.send = (body) => {
          try {
            console.log('Response not found in cache, sending it');
            const response = originalSend.call(res,body);
            t0 = performance.now();
            that.redisCache.setKey(namespace, cacheKey, body, duration);
            return response;
          } catch (error) {
            console.log(error);
            throw new ServerError('something broke', error);
          }
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