import { RequestHandler } from 'express';
import { RedisNamespaces } from './types';
import { RedisCache } from './redisCache';
import { ServerError } from 'common-common/src/errors';

export class CacheDecorator {
  private redisCache: RedisCache;

  public setCache(redisCache: RedisCache) {
    this.redisCache = redisCache;
  }

  public cache(duration: number, key = '', namespace: RedisNamespaces = RedisNamespaces.Route_Response): RequestHandler {
    return async function cacheMiddleware(req, res, next) {
      const cacheKey = `${req.originalUrl}${key}`;
      try {
        if (!this.redisCache) {
          next();
          return;
        }
        // Try to fetch the response from Redis cache
        const cachedResponse = await this.redisCache.getKey(namespace, cacheKey);
        if (cachedResponse) {
          // Response found in cache, send it
          console.log('Response found in cache, sending it');
          res.set('X-Cache', 'HIT');
          res.status(200).send(JSON.parse(cachedResponse));
          return;
        }
        // Response not found in cache, generate it and cache it
        // Response not found in cache, generate it and cache it
        const originalSend = res.send;
        res.send = (body) => {
          try {
            console.log('Response not found in cache, sending it');
            const response = originalSend.call(res,body);
            try {
              // const jsonBody = JSON.parse(body);
              // if(jsonBody && jsonBody.status=='Success') {
              if(res.statusCode == 200) {
                this.redisCache.setKey(namespace, cacheKey, body, duration);
              }
            } catch (error) {
              console.log('decorator: error parsing body');
            }
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
    }.bind(this);
  }
}

export const cacheDecorator = new CacheDecorator();