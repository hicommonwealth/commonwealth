import { RequestHandler, Request, Response } from 'express';
import { RedisNamespaces } from './types';
import { RedisCache } from './redisCache';
import { ServerError } from 'common-common/src/errors';
import { defaultKeyGenerator, CacheKeyDuration, isCacheKeyDuration } from './cacheKeyUtils';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

export class CacheDecorator {
  private redisCache: RedisCache;

  // Set redis cache instance
  public setCache(redisCache: RedisCache) {
    this.redisCache = redisCache;
  }

  // Cache decorator for express routes
  // duration: cache duration in seconds, 0 means no expiry
  // keyGenerator: function to generate cache key, default is the route path
  // namespace: namespace for the cache key, default is Route_Response
  public cacheMiddleware(
    duration: number,
    keyGenerator: (req: Request) => string | CacheKeyDuration = defaultKeyGenerator,
    namespace: RedisNamespaces = RedisNamespaces.Route_Response
  ): RequestHandler {
    const initInterceptor = this.initInterceptor.bind(this);
    const checkCacheAndSendResponseIfFound =
      this.checkCacheAndSendResponseIfFound.bind(this);
    return async function cache(req, res, next) {
      // If cache is not set, skip caching
      if (!this.redisCache) {
        log.trace(`cacheMiddleware: cache undefined`);
        return next();
      }

      // if you like to skip caching based on some condition, return null from keyGenerator
      let cacheKey = keyGenerator(req);
      let cacheDuration = duration;
      // check if cacheKey is object with cacheKey and cacheDuration
      // if yes, override duration and cacheKey
      if (cacheKey && isCacheKeyDuration(cacheKey)) {
        cacheDuration = cacheKey.cacheDuration;
        cacheKey = cacheKey.cacheKey;
      }

      if (!cacheKey) {
        log.trace(`Cache key not found for ${req.originalUrl}`);
        return next();
      }

      try {
        // Try to fetch the response from Redis cache
        const found = await checkCacheAndSendResponseIfFound(
          res,
          cacheKey,
          namespace
        );
        if (found) {
          return;
        }

        // Response not found in cache, generate it and cache it
        const originalSend = res.send;
        res.send = initInterceptor(
          cacheKey,
          namespace,
          cacheDuration,
          originalSend,
          res
        );
        return next();
      } catch (err) {
        log.error(`Error fetching cache ${cacheKey}`);
        log.error(err);
        return next();
      }
    }.bind(this);
  }

  // Check if the response is already cached, if yes, send it
  // Returns true if response is found in cache, false otherwise
  // it can be called from anywhere, not just from cache middleware
  public async checkCacheAndSendResponseIfFound(
    res: Response,
    cacheKey: string,
    namespace: RedisNamespaces = RedisNamespaces.Route_Response
  ): Promise<boolean> {
    if (!cacheKey) {
      log.trace(`Cache key not found for ${res.req.originalUrl}`);
      return false;
    }

    const cachedResponse = await this.redisCache.getKey(namespace, cacheKey);
    if (cachedResponse) {
      // Response found in cache, send it
      log.trace(`Response ${cacheKey} FOUND in cache, sending it`);
      res.set('X-Cache', 'HIT');
      // If the response is a JSON, parse it and send it
      try {
        const parsedResponse = JSON.parse(cachedResponse);
        res.status(200).send(parsedResponse);
      } catch (error) {
        // If the response is not a JSON, send it as it is
        res.status(200).send(cachedResponse);
      }
      return true;
    }
    return false;
  }

  // Cache the response
  public async cacheResponse(
    cacheKey: string,
    valueToCache: string,
    duration: number,
    namespace: RedisNamespaces = RedisNamespaces.Route_Response
  ) {
    return await this.redisCache.setKey(
      namespace,
      cacheKey,
      valueToCache,
      duration
    );
  }

  // Check if the response is already cached, if yes, return it
  public async checkCache(
    cacheKey: string,
    namespace: RedisNamespaces = RedisNamespaces.Route_Response
  ): Promise<string> {
    return await this.redisCache.getKey(namespace, cacheKey);
  }

  // response interceptor to cache the response and send it
  private initInterceptor(
    cacheKey: string,
    namespace: RedisNamespaces,
    duration: number,
    originalSend,
    res
  ) {
    return function resSendInterceptor(body: any) {
      try {
        log.trace(`Response ${cacheKey} not found in cache, sending it`);
        const response = originalSend.call(res, body);
        try {
          if (res.statusCode == 200) {
            this.redisCache.setKey(namespace, cacheKey, body, duration);
          }
        } catch (error) {
          log.warn(`Error writing cache ${cacheKey} skip writing cache`);
        }
        return response;
      } catch (err) {
        log.error(`Error catch all res.send ${cacheKey}`);
        log.error(err);
        throw new ServerError('something broke', err);
      }
    }.bind(this);
  }
}

export const cacheDecorator = new CacheDecorator();
