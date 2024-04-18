import { express, trpc } from '@hicommonwealth/adapters';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import * as community from './community';
import * as contest from './contest';
import * as feed from './feed';
import * as integrations from './integrations';
import * as thread from './threads';

/**
 * API v1 - tRPC Router
 */
const apiV1 = trpc.router({
  community: community.trpcRouter,
  thread: thread.trpcRouter,
  integrations: integrations.trpcRouter,
  feed: feed.trpcRouter,
  contest: contest.trpcRouter,
});
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
router.use('/v1/docs', swaggerUi.serve);
router.get(
  '/v1/docs',
  swaggerUi.setup(null, { swaggerUrl: '../openapi.json' }),
);

router.use('/v1/rest', express.statsMiddleware, trpc.toOpenApiExpress(apiV1));
router.use('/v1', express.statsMiddleware, trpc.toExpress(apiV1));

export default router;
