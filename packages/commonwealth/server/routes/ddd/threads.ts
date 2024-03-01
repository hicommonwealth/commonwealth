import { express, trpc } from '@hicommonwealth/adapters';
import { Thread } from '@hicommonwealth/model';
import { Router } from 'express';
import passport from 'passport';

export const expressRouter = Router();
expressRouter.get(
  '/getBulkThreads/:community_id?',
  passport.authenticate('jwt', { session: false }),
  express.query(Thread.GetBulkThread()),
);

export const trpcRouter = trpc.router({
  getBulkThreads: trpc.query(Thread.GetBulkThread),
});
