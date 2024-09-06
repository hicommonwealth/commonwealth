import { express, trpc } from '@hicommonwealth/adapters';
import cors from 'cors';
import { Router } from 'express';
import passport from 'passport';
import { config } from '../config';
import * as comment from './comment';
import * as community from './community';
import * as thread from './threads';

const { createCommunity, getCommunities, getCommunity, getMembers } =
  community.trpcRouter;
const { createThread, createThreadReaction } = thread.trpcRouter;
const { createComment, getComments } = comment.trpcRouter;
//const { getBulkThreads } = thread.trpcRouter;

const api = {
  createCommunity,
  getCommunities,
  getCommunity,
  getMembers,
  getComments,
  createThread,
  createThreadReaction,
  //getBulkThreads,
  createComment,
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
