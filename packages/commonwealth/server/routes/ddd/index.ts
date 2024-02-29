import { express, trpc } from '@hicommonwealth/adapters';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import * as community from './community';

/**
 * Express router
 */
const router = Router();
router.use('/community', express.statsMiddleware, community.expressRouter);
router.use(express.errorMiddleware);

/**
 * tRPC router
 */
const trpcRouter = trpc.router({ community: community.trpcRouter });

/**
 * OpenAPI spec
 */
router.get('/trpc/openapi.json', (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host') + '/ddd/trpc';
  res.set('Cache-Control', `public, max-age=${5 * 60 * 1000}`);
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
router.use('/trpc', express.statsMiddleware, trpc.toExpress(trpcRouter));

export default router;
