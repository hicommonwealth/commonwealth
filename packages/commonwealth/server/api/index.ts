import { express, trpc } from '@hicommonwealth/adapters';
import { ChainEvents } from '@hicommonwealth/model';
import { Router, raw } from 'express';
import swaggerUi from 'swagger-ui-express';
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

/**
 * API v1 - tRPC Router
 */
const artifacts = {
  user: user.trpcRouter,
  community: community.trpcRouter,
  thread: thread.trpcRouter,
  integrations: integrations.trpcRouter,
  feed: feed.trpcRouter,
  contest: contest.trpcRouter,
  subscription: subscription.trpcRouter,
  loadTest: loadTest.trpcRouter,
};

if (config.NOTIFICATIONS.FLAG_KNOCK_INTEGRATION_ENABLED) {
  artifacts['email'] = email.trpcRouter;
}

const apiV1 = trpc.router(artifacts);
export type ApiV1 = typeof apiV1;

/**
 * API v1 - Express Router
 */
const router = Router();

/**
 * OpenAPI spec
 */
router.get('/v1/openapi.json', (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host') + '/api/v1/rest';
  return res.json(
    trpc.toOpenApiDocument(apiV1, {
      title: 'Common API',
      version: '1.0.0',
      baseUrl,
    }),
  );
});

router.post(
  '/v1/rest/chainevent/ChainEventCreated/:id',
  raw({ type: '*/*', limit: '10mb', inflate: true }),
  (req, res, next) => {
    ChainEvents.verifyAlchemySignature(req);
    return next();
  },
  // parse body as JSON (native express.json middleware doesn't work here)
  (req, res, next) => {
    req.body = JSON.parse(req.body);
    next();
  },
  express.command(ChainEvents.ChainEventCreated()),
);

router.use('/v1/docs', swaggerUi.serve);
router.get(
  '/v1/docs',
  // @ts-expect-error StrictNullChecks
  swaggerUi.setup(null, { swaggerUrl: '../openapi.json' }),
);

router.use('/v1/rest', express.statsMiddleware, trpc.toOpenApiExpress(apiV1));
router.use('/v1', express.statsMiddleware, trpc.toExpress(apiV1));

export default router;
