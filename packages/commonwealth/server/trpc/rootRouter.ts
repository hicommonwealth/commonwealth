import { generateOpenApiDocument } from 'trpc-openapi';
import { subscriptionRouter } from './resources/subscription/subscriptionRouter';
import { mergeRouters } from './trpc';

export const appRouter = mergeRouters(subscriptionRouter);

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Commonwealth OpenAPI',
  version: '1.0.0',
  baseUrl: 'http://localhost:8080/trpc',
});

export type AppRouter = typeof appRouter;
