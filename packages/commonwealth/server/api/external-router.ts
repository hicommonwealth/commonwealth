import { express, trpc } from '@hicommonwealth/adapters';
import cors from 'cors';
import { Router } from 'express';
import passport from 'passport';
import { config } from '../config';
import * as comment from './comment';
import * as community from './community';
import {
  addRateLimiterMiddleware,
  apiKeyAuthMiddleware,
} from './external-router-middleware';
import * as thread from './thread';
import * as topic from './topic';

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
  getThreads,
  createThread,
  updateThread,
  createThreadReaction,
  deleteReaction,
  deleteThread,
} = thread.trpcRouter;
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  createCommentReaction,
} = comment.trpcRouter;
const { getTopics } = topic.trpcRouter;

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
  getThreads,
  deleteThread,
  getTopics,
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
// eslint-disable-next-line @typescript-eslint/no-misused-promises
if (config.NODE_ENV !== 'test') router.use(apiKeyAuthMiddleware);

if (config.NODE_ENV !== 'test' && config.CACHE.REDIS_URL) {
  addRateLimiterMiddleware();
}

const trpcRouter = trpc.router(api);
trpc.useOAS(router, trpcRouter, {
  title: 'Common API',
  path: PATH,
  version: '0.0.1',
});

export { PATH, router };
