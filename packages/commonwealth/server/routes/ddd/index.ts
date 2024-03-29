import { express, trpc } from '@hicommonwealth/adapters';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import * as community from './community';
import * as feed from './feed';
import * as integrations from './integrations';
import * as thread from './threads';

/**
 * tRPC router
 */
const trpcRouter = trpc.router({
  community: community.trpcRouter,
  thread: thread.trpcRouter,
  integrations: integrations.trpcRouter,
  feed: feed.trpcRouter,
});

export type AppRouter = typeof trpcRouter;

const router = Router();
/**
 * OpenAPI spec
 */
router.get('/trpc/openapi.json', (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host') + '/ddd/trpc/rest';
  return res.json(
    trpc.toOpenApiDocument(trpcRouter, {
      title: 'Common API',
      version: '1.0.0',
      baseUrl,
    }),
  );
});
router.use('/trpc/docs', swaggerUi.serve);
router.get(
  '/trpc/docs',
  swaggerUi.setup(null, { swaggerUrl: '../openapi.json' }),
);

router.use(
  '/trpc/rest',
  express.statsMiddleware,
  trpc.toOpenApiExpress(trpcRouter),
);

router.use('/trpc', express.statsMiddleware, trpc.toExpress(trpcRouter));

export default router;
