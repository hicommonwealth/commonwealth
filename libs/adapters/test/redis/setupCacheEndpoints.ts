import { ServerError } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { Express } from 'express';
import { CustomRequest, lookupKeyDurationInReq } from '../../src';
import { CacheDecorator } from '../../src/redis';

const log = logger(import.meta.filename);

export enum CACHE_ENDPOINTS {
  BROKEN_5XX = '/cachedummy/broken5xx',
  BROKEN_4XX = '/cachedummy/broken4xx',
  JSON = '/cachedummy/json',
  TEXT = '/cachedummy/text',
  CUSTOM_KEY_DURATION = '/cachedummy/customKeyDuration',
}

export const setupCacheTestEndpoints = (
  appAttach: Express,
  cacheDecorator: CacheDecorator,
) => {
  // /cachedummy endpoint for testing
  appAttach.get(
    CACHE_ENDPOINTS.BROKEN_4XX,
    cacheDecorator.cacheMiddleware(3),
    async (req, res) => {
      log.info(`${CACHE_ENDPOINTS.BROKEN_4XX} called`);
      res.status(400).json({ message: 'cachedummy 400 response' });
    },
  );

  appAttach.get(
    CACHE_ENDPOINTS.JSON,
    cacheDecorator.cacheMiddleware(3),
    async (req, res) => {
      log.info(`${CACHE_ENDPOINTS.JSON} called`);
      res.json({ message: 'cachedummy response' });
    },
  );

  appAttach.post(
    CACHE_ENDPOINTS.CUSTOM_KEY_DURATION,
    (req: CustomRequest, res, next) => {
      log.info(`${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} called`);
      const body = req.body;
      if (!body || !body.duration || !body.key) {
        return next();
      }
      req.cacheKey = body.key;
      req.cacheDuration = body.duration;
      return next();
    },
    cacheDecorator.cacheMiddleware(3, lookupKeyDurationInReq),
    async (req, res) => {
      res.json(req.body);
    },
  );

  // Uncomment the following lines if you want to use the /cachedummy/json route
  // app.post('/cachedummy/json', cacheDecorator.cacheInvalidMiddleware(3), async (req, res) => {
  //   res.json({ 'message': 'cachedummy response' });
  // });

  appAttach.get(
    CACHE_ENDPOINTS.TEXT,
    cacheDecorator.cacheMiddleware(3),
    async function cacheTextEndpoint(req, res) {
      log.info(`${CACHE_ENDPOINTS.TEXT} called`);
      res.send('cachedummy response');
    },
  );

  appAttach.get(
    CACHE_ENDPOINTS.BROKEN_5XX,
    cacheDecorator.cacheMiddleware(3),
    async (req, res, next) => {
      log.info(`${CACHE_ENDPOINTS.BROKEN_5XX} called`);
      const err = new Error('route error');
      return next(new ServerError('broken route', err));
    },
  );
};
