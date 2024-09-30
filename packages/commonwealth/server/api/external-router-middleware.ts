import { RedisCache } from '@hicommonwealth/adapters';
import { AppError, logger } from '@hicommonwealth/core';
import { getSaltedApiKeyHash, models } from '@hicommonwealth/model';
import { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Op } from 'sequelize';
import { config } from '../config';
import * as comment from './comment';
import * as community from './community';
import { router } from './external-router';
import * as thread from './threads';

const log = logger(import.meta);

export async function apiKeyAuthMiddleware(
  req: Request,
  _response: Response,
  next: NextFunction,
) {
  // whitelist docs and openAPI spec
  if (req.path.startsWith('/docs/') || req.path === '/openapi.json') {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) throw new AppError('Unauthorized', 401);
  if (typeof apiKey !== 'string') throw new AppError('Unauthorized', 401);

  const address = await models.Address.findOne({
    attributes: ['user_id'],
    where: {
      address: req.headers['address'],
      verified: { [Op.ne]: null },
    },
  });
  if (!address || !address.user_id) throw new AppError('Unauthorized', 401);

  const apiKeyRecord = await models.ApiKey.findOne({
    where: {
      user_id: address.user_id,
    },
  });
  if (!apiKeyRecord) throw new AppError('Unauthorized', 401);

  const hashedApiKey = getSaltedApiKeyHash(apiKey, apiKeyRecord.salt);

  if (hashedApiKey !== apiKeyRecord.hashed_api_key)
    throw new AppError('Unauthorized', 401);

  const user = await models.User.findOne({
    where: {
      id: address.user_id,
    },
  });
  if (!user) throw new AppError('Unauthorized', 401);

  req.user = user;

  // record access in background - best effort
  apiKeyRecord.updated_at = new Date();
  void apiKeyRecord.save();

  return next();
}

export function addRateLimiterMiddleware() {
  if (!config.CACHE.REDIS_URL) {
    log.warn('RATE LIMITER NOT STARTED: Redis url not provided.');
    return;
  }

  // not using the cache port because the rate limiter is explicitly only
  // compatible with Redis and the `sendCommand` function which sends arbitrary
  // commands that only Redis may support
  const redis = new RedisCache(config.CACHE.REDIS_URL);

  const baseLimiterOptions = {
    standardHeaders: true,
    legacyHeaders: false,
    // eslint-disable-next-line @typescript-eslint/require-await
    keyGenerator: async (req: Request) => {
      return `${req.path}_${req.headers['x-api-key']}`;
    },
  };

  // 10 requests per minute (1 request per 6 seconds average)
  const tierOneRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    store: new RedisStore({
      prefix: 'tier_one_rate_limit',
      sendCommand: (...args: string[]) => redis.sendCommand(args),
    }),
    ...baseLimiterOptions,
  });
  // 60 requests per minute (1 per second average)
  const tierTwoRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    store: new RedisStore({
      prefix: 'tier_two_rate_limit',
      sendCommand: (...args: string[]) => redis.sendCommand(args),
    }),
    ...baseLimiterOptions,
  });

  // construct express request paths from trpc routers
  const communityPaths = Object.keys(community.trpcRouter).map(
    (p) => `/${p[0].toUpperCase()}${p.substring(1)}`,
  );
  const threadPaths = Object.keys(thread.trpcRouter).map(
    (p) => `/${p[0].toUpperCase()}${p.substring(1)}`,
  );
  const commentPaths = Object.keys(comment.trpcRouter).map(
    (p) => `/${p[0].toUpperCase()}${p.substring(1)}`,
  );

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.use(async (req: Request, res: Response, next: NextFunction) => {
    if (communityPaths.includes(req.path)) {
      return tierOneRateLimiter(req, res, next);
    } else if (
      threadPaths.includes(req.path) ||
      commentPaths.includes(req.path)
    ) {
      return tierTwoRateLimiter(req, res, next);
    } else {
      return tierOneRateLimiter(req, res, next);
    }
  });
}
