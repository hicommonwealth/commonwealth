import { express, trpc } from '@hicommonwealth/adapters';
import { models } from '@hicommonwealth/model';
import cors from 'cors';
import { createHash } from 'crypto';
import { NextFunction, Request, Response, Router } from 'express';
import passport from 'passport';
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

function getSaltedApiKeyHash(apiKey: string, salt: string): string {
  return createHash('sha256')
    .update(apiKey + salt)
    .digest('hex');
}

// API Key Authentication
router.use(async (req: Request, response: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) throw new Error('Missing API key');
  if (typeof apiKey !== 'string') throw new Error('Invalid API key');

  const address = await models.Address.findOne({
    attributes: ['user_id'],
    where: {
      address: req.headers['address'],
      verified: { [Op.ne]: null },
    },
  });
  if (!address || !address.user_id) throw new Error('Address not found');

  const apiKeyRecord = await models.ApiKey.findOne({
    where: {
      user_id: address.user_id,
    },
  });
  if (!apiKeyRecord) throw new Error('No API key registered for address');

  const hashedApiKey = getSaltedApiKeyHash(apiKey, apiKeyRecord.salt);

  if (hashedApiKey !== apiKeyRecord.hashed_api_key)
    throw new Error('UNAUTHENTICATED');

  req.user = models.User.build({
    ...address.User!,
  });

  return next();
});

const trpcRouter = trpc.router(api);
trpc.useOAS(router, trpcRouter, {
  title: 'Common API',
  path: PATH,
  version: '0.0.1',
});

export { PATH, router };
