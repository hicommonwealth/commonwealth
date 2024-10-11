import { express, trpc } from '@hicommonwealth/adapters';
import { Comment, Community, Feed } from '@hicommonwealth/model';
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
import * as thread from './threads';
import * as user from './user';

const {
  createCommunity,
  updateCommunity,
  createTopic,
  updateTopic,
  deleteTopic,
  createGroup,
  updateGroup,
  deleteGroup,
  joinCommunity,
} = community.trpcRouter;
const {
  createThread,
  updateThread,
  deleteThread,
  createThreadReaction,
  deleteReaction,
} = thread.trpcRouter;
const { createComment, updateComment, deleteComment, createCommentReaction } =
  comment.trpcRouter;
const { getNewContent } = user.trpcRouter;

const api = {
  getUserActivity: trpc.query(Feed.GetUserActivity, trpc.Tag.User, true),
  getNewContent,
  getCommunities: trpc.query(
    Community.GetCommunities,
    trpc.Tag.Community,
    true,
  ),
  getCommunity: trpc.query(Community.GetCommunity, trpc.Tag.Community, true),
  getMembers: trpc.query(Community.GetMembers, trpc.Tag.Community, true),
  getComments: trpc.query(Comment.GetComments, trpc.Tag.Comment, true),
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
  joinCommunity,
};

const PATH = '/api/v1';
const router = Router();
router.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'api-key', 'address'],
  }),
  express.statsMiddleware,
);

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
