import { express, trpc } from '@hicommonwealth/adapters';
import cors from 'cors';
import { Router } from 'express';
import passport from 'passport';
import { config } from '../config';
import * as comment from './comment';
import * as community from './community';
import * as thread from './thread';
import * as topic from './topic';

const {
  createCommunity,
  updateCommunity,
  getCommunities,
  getCommunity,
  getMembers,
  deleteTopic,
  deleteGroup,
} = community.trpcRouter;
const { getThreads, createThread, updateThread, createThreadReaction, deleteThread } =
  thread.trpcRouter;
const {
  createComment,
  createCommentReaction,
  updateComment,
  getComments,
  deleteComment,
} = comment.trpcRouter;
const { getTopics } = topic.trpcRouter;

const api = {
  createCommunity,
  updateCommunity,
  getCommunities,
  getCommunity,
  getMembers,
  deleteTopic,
  deleteGroup,
  getComments,
  createThread,
  updateThread,
  createThreadReaction,
  getThreads,
  deleteThread,
  getTopics,
  createComment,
  updateComment,
  createCommentReaction,
  deleteComment,
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

const trpcRouter = trpc.router(api);
trpc.useOAS(router, trpcRouter, {
  title: 'Common API',
  path: PATH,
  version: '0.0.1',
});

export { PATH, router };
