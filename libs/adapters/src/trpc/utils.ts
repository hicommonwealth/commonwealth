import { logger } from '@hicommonwealth/core';
import { TRPCError } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { Request, Response, Router } from 'express';
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

export interface OasOptions {
  title: string;
  path: string;
  version: string;
  securityScheme: 'apiKey' | 'jwt';
}

export function toOpenApiDocument(
  router: OpenApiRouter,
  host: string,
  options: OasOptions,
) {
  const securitySchemes: GenerateOpenApiDocumentOptions['securitySchemes'] =
    options.securityScheme === 'apiKey'
      ? {
          apiKey: {
            type: 'apiKey',
            description: 'Create an API key on Common to use the Common API',
            name: 'x-api-key',
            in: 'header',
          },
        }
      : {
          apiKey: {
            type: 'apiKey',
            description:
              'A JWT is required to authenticate with the internal API',
            name: 'jwt',
            in: 'header',
          },
        };

  return generateOpenApiDocument(router, {
    title: options.title,
    version: options.version,
    baseUrl: `${host}${options.path}`,
    securitySchemes,
  });
}

export function useOAS(
  router: Router,
  trpcRouter: OpenApiRouter,
  options: OasOptions,
) {
  router.get('/openapi.json', (req, res) => {
    return res.json(
      toOpenApiDocument(
        trpcRouter,
        req.protocol + '://' + req.get('host'),
        options,
      ),
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
