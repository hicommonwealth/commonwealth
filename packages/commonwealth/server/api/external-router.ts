import { express, trpc } from '@hicommonwealth/adapters';
import cors from 'cors';
import { Router } from 'express';
import * as comment from './comment';
import * as community from './community';
import * as thread from './thread';
import * as topic from './topic';

const { getCommunities, getCommunity, getMembers } = community.trpcRouter;
const { getComments } = comment.trpcRouter;
const { getThreads } = thread.trpcRouter;
const { getTopics } = topic.trpcRouter;
//const { getBulkThreads } = thread.trpcRouter;

const api = {
  getCommunities,
  getCommunity,
  getMembers,
  getComments,
  getThreads,
  getTopics,
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
