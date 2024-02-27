import { express, trpc } from '@hicommonwealth/adapters';
import { RequestHandler, Router } from 'express';
import swaggerUi from 'swagger-ui-express';
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
// openapi
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
// use stats middleware on all trpc routes
trpcExpressRouter.use('/', express.statsMiddleware, trpc.toExpress(trpcRouter));
