import { logger } from '@hicommonwealth/core';
import { TRPCError } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { Request, Response, Router } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import swaggerUi from 'swagger-ui-express';
import {
  createOpenApiExpressMiddleware,
  generateOpenApiDocument,
  type GenerateOpenApiDocumentOptions,
  type OpenApiRouter,
} from 'trpc-swagger';

const log = logger(import.meta);

const logError = (path: string | undefined, error: TRPCError) => {
  const errorName = error.cause?.name ?? error.name;
  const errorMessage = error.cause?.message ?? error.message;
  const msg = `${error.code}: [${errorName}] ${path}: ${errorMessage}`;
  const issues =
    error.cause && 'issues' in error.cause && Array.isArray(error.cause.issues)
      ? error.cause.issues.map((i) => i.code)
      : [];
  const fingerprint = [error.code, errorName, path, ...issues].join('-');

  error.code === 'INTERNAL_SERVER_ERROR'
    ? log.error(msg, error.cause, { fingerprint })
    : log.warn(msg, { fingerprint });
};

// used for TRPC like routes (Internal)
export const toExpress = (router: OpenApiRouter) =>
  createExpressMiddleware({
    router,
    createContext: ({ req, res }: { req: Request; res: Response }) => ({
      req,
      res,
    }),
    onError: ({ path, error }) => logError(path, error),
  });

// used for REST like routes (External)
const toOpenApiExpress = (router: OpenApiRouter) =>
  createOpenApiExpressMiddleware({
    router,
    createContext: ({ req, res }: { req: Request; res: Response }) => ({
      req,
      res,
    }),
    onError: ({ path, error }: { path: string; error: TRPCError }) =>
      logError(path, error),
    responseMeta: undefined,
    maxBodySize: undefined,
  });

const toOpenApiDocument = (
  router: OpenApiRouter,
  opts: GenerateOpenApiDocumentOptions,
): OpenAPIV3.Document => generateOpenApiDocument(router, { ...opts });

interface Options {
  title: string;
  path: string;
  version: string;
}

export function useOAS(
  router: Router,
  trpcRouter: OpenApiRouter,
  { title, path, version }: Options,
) {
  router.get('/openapi.json', (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host') + path;
    return res.json(
      toOpenApiDocument(trpcRouter, {
        title,
        version,
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

  const oasHandler = toOpenApiExpress(trpcRouter);
  router.use((req, res, next) => {
    oasHandler(req, res).catch(next);
  });
}
