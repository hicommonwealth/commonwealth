import { express, trpc } from '@hicommonwealth/adapters';
import cors from 'cors';
import { Router } from 'express';
import * as community from './community';
import * as thread from './threads';

const { getCommunities, getCommunity, getMembers } = community.trpcRouter;
const { createThread } = thread.trpcRouter;

const api = {
  getCommunities,
  getCommunity,
  getMembers,
  createThread,
  //getBulkThreads,
};

const PATH = '/api/v1';
const router = Router();
router.use(cors(), express.statsMiddleware);

const trpcRouter = trpc.router(api);
trpc.useOAS(router, trpcRouter, {
  title: 'Common API',
  path: PATH,
  version: '0.0.1',
});

export { PATH, router };
