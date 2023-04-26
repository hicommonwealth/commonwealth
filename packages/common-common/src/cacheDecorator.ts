import { RequestHandler, Request, Response } from 'express';
import { RedisNamespaces } from './types';
import { RedisCache } from './redisCache';
import { ServerError } from 'common-common/src/errors';
import { defaultKeyGenerator } from './cacheKeyUtils';


export class CacheDecorator {
  private redisCache: RedisCache;

  public setCache(redisCache: RedisCache) {
    this.redisCache = redisCache;
  }

  // Cache decorator for express routes
  // duration: cache duration in seconds, 0 means no expiry
  // keyGenerator: function to generate cache key, default is the route path
  // namespace: namespace for the cache key, default is Route_Response
  public cache(duration: number, keyGenerator: (req: Request) => string = defaultKeyGenerator, namespace: RedisNamespaces = RedisNamespaces.Route_Response): RequestHandler {
    return async function cacheMiddleware(req, res, next) {
      // If cache is not set, skip caching
      if (!this.redisCache) {
        console.log(`cache undefined`)
        next();
        return;
      }

      // if you like to skip caching based on some condition, return null from keyGenerator
      const cacheKey = keyGenerator(req);
      if(!cacheKey) {
        console.log(`Cache key not found for ${req.originalUrl}`)
        next();
        return;
      }

      try {
        // Try to fetch the response from Redis cache
        const found = await this.checkCacheAndSendResponseIfFound(cacheKey, namespace, res);
        if (found) {
          return;
        }

        // Response not found in cache, generate it and cache it
        const originalSend = res.send;
        res.send = this.initInterceptor(cacheKey, namespace, duration, originalSend, res);
        next();
      } catch (error) {
        console.log(`Error fetching cache ${cacheKey}`)
        console.error(error);
        next();
      }
    }.bind(this);
  }

  // Check if the response is already cached, if yes, send it
  // Returns true if response is found in cache, false otherwise
  // it can be called from anywhere, not just from cache middleware
  public async checkCacheAndSendResponseIfFound(res: Response, cacheKey: string, namespace: RedisNamespaces = RedisNamespaces.Route_Response): Promise<boolean> {
    if(!cacheKey) {
      console.log(`Cache key not found for ${res.req.originalUrl}`)
      return false;
    }

    const cachedResponse = await this.redisCache.getKey(namespace, cacheKey);
    if (cachedResponse) {
      // Response found in cache, send it
      console.log(`Response ${cacheKey} found in cache, sending it`);
      res.set('X-Cache', 'HIT');
      res.status(200).send(JSON.parse(cachedResponse));
      return true;
    }
    return false;
  }

  // response interceptor to cache the response and send it
  private initInterceptor(cacheKey: string, namespace: RedisNamespaces, duration: number, originalSend, res) {
    return function resSendInterceptor(body: any) {
      try {
        console.log(`Response ${cacheKey} not found in cache, sending it`);
        const response = originalSend.call(res,body);
        try {
          if (res.statusCode == 200) {
            this.redisCache.setKey(namespace, cacheKey, body, duration);
          }
        } catch (error) {
          console.log(`Error writing cache ${cacheKey} skip writing cache`)
        }
        return response;
      } catch (error) {
        console.log(`Error catch all res.send ${cacheKey}`)
        console.log(error);
        throw new ServerError('something broke', error);
      }
    }.bind(this)
  };
}

export const cacheDecorator = new CacheDecorator();