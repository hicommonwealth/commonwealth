import { express, trpc } from '@hicommonwealth/adapters';
import { RequestHandler, Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import * as community from './community';

/**
 * Express router
 */
export const expressRouter = Router();
// aggregate sub-routers
expressRouter.use(
  '/community',
  express.statsMiddleware,
  community.expressRouter,
);
// catch-all middleware
expressRouter.use(express.errorMiddleware);

/**
 * tRPC router
 */
export const trpcExpressRouter = Router();
const trpcRouter = trpc.router({ community: community.trpcRouter });

/**
 * OpenAPI Specs from tRPC router
 */
let spec: RequestHandler | undefined = undefined;
trpcExpressRouter.use('/openapi', swaggerUi.serve);
trpcExpressRouter.get('/openapi', (req, res, next) => {
  if (!spec) {
    const baseUrl = req.protocol + '://' + req.get('host') + '/trpc';
    const doc = trpc.toOpenApiDocument(trpcRouter, {
      title: 'Common API',
      version: '1.0.0',
      tags: ['User', 'Community', 'Thread', 'Comment', 'Reaction'],
      baseUrl,
    });
    spec = swaggerUi.setup(doc);
  }
  return spec(req, res, next);
});

// tRPC root
trpcExpressRouter.use('/', express.statsMiddleware, trpc.toExpress(trpcRouter));
