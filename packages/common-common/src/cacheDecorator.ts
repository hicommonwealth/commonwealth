import { RequestHandler, Request, Response } from 'express';
import { RedisNamespaces } from './types';
import { RedisCache } from './redisCache';
import {
  defaultKeyGenerator,
  CacheKeyDuration,
  isCacheKeyDuration,
} from './cacheKeyUtils';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

const XCACHE_HEADER = 'X-Cache';
export enum XCACHE_VALUES {
  UNDEF = 'UNDEF', // cache is undefined
  SKIP = 'SKIP', // cache is disabled
  HIT = 'HIT', // cache hit
  MISS = 'MISS', // cache miss
  NOKEY = 'NOKEY', // cache no key
}

type seconds = number;
export class CacheDecorator {
  private redisCache: RedisCache;

  // Set redis cache instance
  public setCache(redisCache: RedisCache) {
    log.info(`setCache: DISABLE_CACHE ${process.env.DISABLE_CACHE}`);
    // If cache is disabled, skip caching
    if (process.env.DISABLE_CACHE === 'true') {
      log.info(`cacheMiddleware: cache disabled`);
      return;
    }
    this.redisCache = redisCache;
  }

  /**
  * Method to wrap a function with caching mechanism
  * The keyGenerator should be a function returning a unique key for each unique combination of arguments
  * The ttl is the time to live for the cache in seconds
  */
  public cacheWrap<T extends (...args: any[]) => any>(
    override: boolean,
    fn: T,
    key: ((...args: Parameters<T>) => string | CacheKeyDuration) | string,
    duration: seconds,
    namespace: RedisNamespaces = RedisNamespaces.Function_Response
  ) {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let isFunctionCalled = false;
      try {
        // If cache is disabled, skip caching
        if (!this.isEnabled()) {
          log.trace(`Cache disabled, skipping cache`);
          // call the function
          isFunctionCalled = true;
          return await fn(...args);
        }

        // compute key
        let cacheDuration = duration;
        let cacheKey = null;
        if(typeof key === 'function') {
          const computeKey = key(...args);
          if(typeof computeKey === 'string') {
            cacheKey = computeKey;
          } else {
            // if cache key is object with cacheKey and cacheDuration
            if (computeKey && isCacheKeyDuration(computeKey)) {
              cacheDuration = computeKey.cacheDuration;
              cacheKey = computeKey.cacheKey;
            }
          }
        } else {
          cacheKey = key;
        }

        // If cache key is null 
        if (!cacheKey || cacheDuration === undefined || cacheDuration === null) {
          log.trace(`Cache key not found for ${fn.name}`);
          // call the function
          isFunctionCalled = true;
          return await fn(...args);
        }

        // If cache is disabled, skip caching
        if(!override) {
          let cachedValue;
          try {
              cachedValue = await this.checkCache(cacheKey, namespace);
              if (cachedValue) {
                log.trace(`FOUND in cache ${cacheKey}`);
                // Try to parse and return the cached value as JSON
                try {
                  return JSON.parse(cachedValue);
                } catch (error) {
                  // If parsing fails, return the raw cached value
                  log.warn(`Failed to parse cached value for ${key} as JSON, returning raw value. Error: ${error}`);
                }
              }
            } catch (error) {
              // If parsing fails, return the raw cached value
              log.error(`Failed to fetch cached value for ${key} as JSON, ${error}`);
            }
        }

        // call the function and cache the response
        isFunctionCalled = true;
        const result = await fn(...args);
        if(result === undefined || result === null) {
          log.warn(`Function ${fn.name} returned undefined, skipping cache`);
          return result;
        }
        try {
          const ret = await this.cacheResponse(cacheKey, JSON.stringify(result), cacheDuration, namespace);
          if(!ret) throw new Error('Unable to set redis key returned false');
        } catch (error) {
          log.warn(`Error caching value for ${key}: ${error}`);
        }
        return result;
      } catch (error) {
        log.error(`Error in cacheWrap for ${fn.name}: ${error}`);
        if (!isFunctionCalled) {
          return await fn(...args);
        } else {
          throw error;
        };
      }
    };
  }

  // Cache decorator for express routes
  // duration: cache duration in seconds, 0 means no expiry
  // keyGenerator: function to generate cache key, default is the route path
  // namespace: namespace for the cache key, default is Route_Response
  public cacheMiddleware(
    duration: seconds,
    keyGenerator: (
      req: Request
    ) => string | CacheKeyDuration = defaultKeyGenerator,
    namespace: RedisNamespaces = RedisNamespaces.Route_Response
  ): RequestHandler {
    return async function cache(req, res, next) {
      let isNextCalled = false;
      try {
        // If cache is disabled, skip caching
        if (!this.isEnabled()) {
          log.trace(`Cache disabled, skipping cache`);
          res.set(XCACHE_HEADER, XCACHE_VALUES.UNDEF);
          isNextCalled = true;
          return next();
        }

        // cache control header is set to no-cache, skip caching
        if (CacheDecorator.skipCache(req)) {
          res.set(XCACHE_HEADER, XCACHE_VALUES.SKIP);
          isNextCalled = true;
          return next();
        }

        // If cache key is not found, skip caching
        const { cacheKey, cacheDuration } = CacheDecorator.calcCacheKeyDuration(
          req,
          keyGenerator,
          duration
        );
        if (!cacheKey) {
          log.trace(`Cache key not found for ${req.originalUrl}`);
          res.set(XCACHE_HEADER, XCACHE_VALUES.NOKEY);
          isNextCalled = true;
          return next();
        }

        // Try to fetch the response from Redis cache
        const found = await this.checkCacheAndSendResponseIfFound(
          res,
          cacheKey,
          namespace
        );
        if (found) {
          return;
        }
        res.set(XCACHE_HEADER, XCACHE_VALUES.MISS);

        // Response not found in cache, generate it and cache it
        const originalSend = res.send;
        res.send = this.initInterceptor(
          cacheKey,
          namespace,
          cacheDuration,
          originalSend,
          res
        );
        isNextCalled = true;
        return next();
      } catch (err) {
        log.warn(`calling next from cacheMiddleware catch ${req.originalUrl}`);
        log.warn(err);
        if (!isNextCalled) {
          return next();
        }
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

    const cachedResponse = await this.checkCache(cacheKey, namespace);
    if (cachedResponse) {
      // Response found in cache, send it
      log.trace(`Response ${cacheKey} FOUND in cache, sending it`);
      res.set(XCACHE_HEADER, XCACHE_VALUES.HIT);
      // If the response is a JSON, parse it and send it
      try {
        const parsedResponse = JSON.parse(cachedResponse);
        res.status(200).json(parsedResponse);
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
  ): Promise<boolean> {
    if (!this.isEnabled()) return false;

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
    const ret = await this.redisCache.getKey(namespace, cacheKey);
    if (ret) {
      return ret;
    }
  }

  // response interceptor to cache the response and send it
  private initInterceptor(
    cacheKey: string,
    namespace: RedisNamespaces,
    duration: number,
    originalSend,
    res
  ) {
    return async function resSendInterceptor(body: any) {
      try {
        res.send = originalSend;
        res.send(body);
        try {
          if (res.statusCode == 200) {
            const ret = await this.cacheResponse(
              cacheKey,
              body,
              duration,
              namespace
            );
            if (ret) {
              log.trace(`SET: ${cacheKey}`);
            } else {
              log.warn(
                `NOSET: Unable to set redis key returned false ${cacheKey} ${ret}`
              );
            }
          } else {
            log.warn(
              `NOSET: Response status code is not 200 ${cacheKey}, skip writing cache`
            );
          }
        } catch (error) {
          log.warn(
            `SETERR: Error writing cache ${cacheKey} skip writing cache`
          );
        }
      } catch (err) {
        log.error(`Error catch all res.send ${cacheKey}`);
      }
    }.bind(this);
  }

  private static skipCache(req: Request): boolean {
    // check for Cache-Control: no-cache header
    const cacheControl = req.header('Cache-Control');
    if (cacheControl && cacheControl.includes('no-cache')) {
      log.trace(`Cache-Control: no-cache header found, skipping cache`);
      return true;
    }
    return false;
  }

  private static calcCacheKeyDuration(req, keyGenerator, duration) {
    // if you like to skip caching based on some condition, return null from keyGenerator
    let cacheKey = keyGenerator(req);
    let cacheDuration = duration;
    // check if cacheKey is object with cacheKey and cacheDuration
    // if yes, override duration and cacheKey
    if (cacheKey && isCacheKeyDuration(cacheKey)) {
      cacheDuration = cacheKey.cacheDuration;
      cacheKey = cacheKey.cacheKey;
    }

    log.trace(
      `req: ${req.originalUrl}, cacheKey: ${cacheKey}, cacheDuration: ${cacheDuration}`
    );
    return { cacheKey, cacheDuration };
  }

  private isEnabled(): boolean {
    return this.redisCache && this.redisCache.isInitialized();
  }
}

export const cacheDecorator = new CacheDecorator();
