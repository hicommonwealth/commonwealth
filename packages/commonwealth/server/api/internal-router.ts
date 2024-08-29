import { express, trpc } from '@hicommonwealth/adapters';
import { ChainEvents } from '@hicommonwealth/model';
import cors from 'cors';
import { Router, raw } from 'express';
import { config } from '../config';
import * as community from './community';
import * as contest from './contest';
import * as email from './emails';
import * as feed from './feed';
import * as integrations from './integrations';
import * as loadTest from './load-test';
import * as subscription from './subscription';
import * as thread from './threads';
import * as user from './user';
import * as wallet from './wallet';
import * as webhook from './webhook';

const api = {
  user: user.trpcRouter,
  community: community.trpcRouter,
  thread: thread.trpcRouter,
  integrations: integrations.trpcRouter,
  feed: feed.trpcRouter,
  contest: contest.trpcRouter,
  subscription: subscription.trpcRouter,
  loadTest: loadTest.trpcRouter,
  webhook: webhook.trpcRouter,
};

if (config.NOTIFICATIONS.FLAG_KNOCK_INTEGRATION_ENABLED) {
  api['email'] = email.trpcRouter;
}

if (config.ALCHEMY.AA.FLAG_COMMON_WALLET) {
  api['wallet'] = wallet.trpcRouter;
}

const PATH = '/api/internal';
const router = Router();
const trpcRouter = trpc.router(api);
export type API = typeof trpcRouter;

router.use('/trpc', express.statsMiddleware, trpc.toExpress(trpcRouter));

/**
 * Special integration endpoints
 */
router.post(
  '/chainevent/ChainEventCreated/:id',
  raw({ type: '*/*', limit: '10mb', inflate: true }),
  (req, _, next) => {
    ChainEvents.verifyAlchemySignature(req);
    return next();
  },
  // parse body as JSON (native express.json middleware doesn't work here)
  (req, _, next) => {
    req.body = JSON.parse(req.body);
    next();
  },
  express.command(ChainEvents.ChainEventCreated()),
);

if (config.NODE_ENV !== 'production') {
  router.use(cors());
  trpc.useOAS(router, trpcRouter, {
    title: 'Internal API',
    path: PATH,
    version: '0.0.1',
  });
}

export { PATH, router, trpcRouter };
