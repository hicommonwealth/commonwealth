import { trpc } from '@hicommonwealth/adapters';
import cors from 'cors';
import { Router } from 'express';
import { config } from '../config';
import * as comment from './comment';
import * as community from './community';
import * as contest from './contest';
import * as discordBot from './discordBot';
import * as email from './emails';
import * as feed from './feed';
import * as integrations from './integrations';
import * as loadTest from './load-test';
import * as poll from './poll';
import * as subscription from './subscription';
import * as superAdmin from './super-admin';
import * as thread from './thread';
import * as token from './token';
import * as user from './user';
import * as wallet from './wallet';
import * as webhook from './webhook';

const api = {
  user: user.trpcRouter,
  community: community.trpcRouter,
  thread: thread.trpcRouter,
  comment: comment.trpcRouter,
  integrations: integrations.trpcRouter,
  feed: feed.trpcRouter,
  contest: contest.trpcRouter,
  subscriptions: subscription.trpcRouter,
  loadTest: loadTest.trpcRouter,
  webhook: webhook.trpcRouter,
  superAdmin: superAdmin.trpcRouter,
  discordBot: discordBot.trpcRouter,
  token: token.trpcRouter,
  poll: poll.trpcRouter,
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

router.use('/trpc', trpc.toExpress(trpcRouter));

if (config.NODE_ENV !== 'production') {
  router.use(cors());
  trpc.useOAS(router, trpcRouter, {
    title: 'Internal API',
    path: PATH,
    version: '0.0.1',
    securityScheme: 'jwt',
  });
}

export { PATH, router, trpcRouter };
