import { express, RedisCache, trpc } from '@hicommonwealth/adapters';
import { AppError } from '@hicommonwealth/core';
import { getSaltedApiKeyHash, models } from '@hicommonwealth/model';
import cors from 'cors';
import { NextFunction, Request, Response, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import passport from 'passport';
import { RedisStore } from 'rate-limit-redis';
import { Op } from 'sequelize';
import { config } from '../config';
import * as comment from './comment';
import * as community from './community';
import * as thread from './threads';

const {
  getCommunities,
  getCommunity,
  getMembers,
  createCommunity,
  updateCommunity,
  createTopic,
  updateTopic,
  deleteTopic,
  createGroup,
  updateGroup,
  deleteGroup,
} = community.trpcRouter;
const {
  createThread,
  updateThread,
  deleteThread,
  createThreadReaction,
  deleteReaction,
} = thread.trpcRouter;
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  createCommentReaction,
} = comment.trpcRouter;

const api = {
  getCommunities,
  getCommunity,
  getMembers,
  getComments,
  createCommunity,
  updateCommunity,
  createTopic,
  updateTopic,
  deleteTopic,
  createGroup,
  updateGroup,
  deleteGroup,
  createThread,
  updateThread,
  deleteThread,
  createComment,
  updateComment,
  deleteComment,
  createThreadReaction,
  createCommentReaction,
  deleteReaction,
};

const PATH = '/api/v1';
const router = Router();
router.use(cors(), express.statsMiddleware);

// ===============================================================================
/**
 * TODO: Fix and check integration tests
 * Hack router until we figure out why the integration test server fails to authenticate
 * Found when calling createThread in test/util/modelUtils.ts
 * .post('/api/v1/CreateThread')
 */
if (config.NODE_ENV === 'test')
  router.use(passport.authenticate('jwt', { session: false }));

// ===============================================================================

// API Key Authentication
router.use(async (req: Request, response: Response, next: NextFunction) => {
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
});

if (config.NODE_ENV !== 'test' && config.CACHE.REDIS_URL) {
  // not using the cache port because the rate limiter is explicitly only
  // compatible with Redis and the `sendCommand` function which sends arbitrary
  // commands that only Redis may support
  const redis = new RedisCache(config.CACHE.REDIS_URL);

  const baseLimiterOptions = {
    standardHeaders: true,
    legacyHeaders: false,
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

const trpcRouter = trpc.router(api);
trpc.useOAS(router, trpcRouter, {
  title: 'Common API',
  path: PATH,
  version: '0.0.1',
});

export { PATH, router };
