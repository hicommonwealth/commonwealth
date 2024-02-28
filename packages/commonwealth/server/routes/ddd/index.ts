import { express, trpc } from '@hicommonwealth/adapters';
import { RequestHandler, Router } from 'express';
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
let spec: RequestHandler | undefined = undefined;
router.use('/trpc/openapi', swaggerUi.serve);
router.get('/trpc/openapi', (req, res, next) => {
  if (!spec) {
    const baseUrl = req.protocol + '://' + req.get('host') + '/ddd/trpc';
    const doc = trpc.toOpenApiDocument(trpcRouter, {
      title: 'Common API',
      version: '1.0.0',
      baseUrl,
    });
    spec = swaggerUi.setup(doc);
  }
  return spec(req, res, next);
});
router.use('/trpc', express.statsMiddleware, trpc.toExpress(trpcRouter));

export default router;
