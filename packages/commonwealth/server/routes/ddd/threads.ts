import { express, trpc } from '@hicommonwealth/adapters';
import { Thread } from '@hicommonwealth/model';
import { Router } from 'express';

export const expressRouter = Router();
expressRouter.get(
  '/getBulkThreads/:community_id?',
  express.query(Thread.GetBulkThread()),
);

export const trpcRouter = trpc.router({
  getBulkThreads: trpc.query(Thread.GetBulkThread),
});
