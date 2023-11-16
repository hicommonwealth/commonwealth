import { generateOpenApiDocument } from 'trpc-openapi';
import { todoRootRouter } from './routers/todo';
import { mergeRouters } from './trpc';

export const appRouter = mergeRouters(todoRootRouter);

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Commonwealth OpenAPI',
  version: '1.0.0',
  baseUrl: 'http://localhost:8080/trpc',
});

// export type definition of API
export type AppRouter = typeof appRouter;
