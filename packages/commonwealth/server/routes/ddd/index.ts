import { express, trpc } from '@hicommonwealth/adapters';
import { Router } from 'express';
import * as community from './community';

// express router
export const expressRouter = Router();
expressRouter.use(
  '/community',
  express.statsMiddleware,
  community.expressRouter,
);
expressRouter.use(express.errorMiddleware);

// trpc router
export const trpcExpressRouter = Router();
const trpcRouter = trpc.router({ community: community.trpcRouter });
trpcExpressRouter.use('/trpc/panel', (req, res) => {
  const url = req.protocol + '://' + req.get('host') + '/ddd/trpc';
  res.send(trpc.toPanel(trpcRouter, url));
});
trpcExpressRouter.use(
  '/trpc',
  express.statsMiddleware,
  trpc.toExpress(trpcRouter),
);
