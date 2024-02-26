import { express, trpc } from '@hicommonwealth/adapters';
import { Router } from 'express';
import * as community from './community';

// root express router
export const expressRouter = Router();
// aggregate sub-routers
expressRouter.use(
  '/community',
  express.statsMiddleware,
  community.expressRouter,
);
// catch-all middleware
expressRouter.use(express.errorMiddleware);

// root trpc router
export const trpcExpressRouter = Router();
// aggregate sub-routers
const trpcRouter = trpc.router({ community: community.trpcRouter });
// trpc specs
trpcExpressRouter.use('/panel', (req, res) => {
  const url = req.protocol + '://' + req.get('host') + '/trpc';
  res.send(trpc.toPanel(trpcRouter, url));
});
// use stats middleware on all trpc routes
trpcExpressRouter.use('/', express.statsMiddleware, trpc.toExpress(trpcRouter));
