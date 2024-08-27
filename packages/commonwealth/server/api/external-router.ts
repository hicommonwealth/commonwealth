import { express, trpc } from '@hicommonwealth/adapters';
import cors from 'cors';
import { Router } from 'express';
import * as community from './community';

const { getCommunities, getCommunity, getMembers } = community.trpcRouter;
//const { getBulkThreads } = thread.trpcRouter;

const api = {
  getCommunities,
  getCommunity,
  getMembers,
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
