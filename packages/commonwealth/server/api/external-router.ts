import { express, trpc } from '@hicommonwealth/adapters';
import cors from 'cors';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import * as community from './community';

const { getCommunities, getCommunity, getMembers } = community.trpcRouter;
//const { getBulkThreads } = thread.trpcRouter;

const api = {
  getCommunities,
  getCommunity,
  getMembers,
  //getBulkThreads,
};

const router = Router();
const trpcRouter = trpc.router(api);
export const API_PATH = '/api/v1';
export const API_VERSION = '1.0.0';

/**
 * Publish OpenAPI Spec
 */
router.get('/openapi.json', (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host') + API_PATH;
  return res.json(
    trpc.toOpenApiDocument(trpcRouter, {
      title: 'Common API',
      version: API_VERSION,
      baseUrl,
      securitySchemes: {
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              refreshUrl: 'https://example.com/oauth/refresh',
              scopes: {},
            },
          },
        },
      },
    }),
  );
});
router.use('/docs', swaggerUi.serve);
router.get(
  '/docs',
  swaggerUi.setup(undefined, { swaggerUrl: '../openapi.json' }),
);

router.use(cors());
router.use(express.statsMiddleware, trpc.toOpenApiExpress(trpcRouter));

export { router };
