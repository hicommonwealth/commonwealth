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
  getGlobalActivity: trpc.query(Feed.GetGlobalActivity, trpc.Tag.User, {
    forceSecure: true,
    ttlSecs: config.NO_GLOBAL_ACTIVITY_CACHE ? undefined : 60 * 5,
  }),
  getUserActivity: trpc.query(Feed.GetUserActivity, trpc.Tag.User, {
    forceSecure: true,
  }),
  getNewContent,
  getCommunities: trpc.query(Community.GetCommunities, trpc.Tag.Community, {
    forceSecure: true,
  }),
  getCommunity: trpc.query(Community.GetCommunity, trpc.Tag.Community, {
    forceSecure: true,
  }),
  getMembers: trpc.query(Community.GetMembers, trpc.Tag.Community, {
    forceSecure: true,
  }),
  getComments: trpc.query(Comment.GetComments, trpc.Tag.Comment, {
    forceSecure: true,
  }),
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
  version: '1.0.0',
});

export { PATH, router };
