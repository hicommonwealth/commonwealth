import { generateOpenApiDocument } from 'trpc-openapi';
import { SERVER_URL } from '../config';
import { subscriptionRouter } from './resources/subscription/subscriptionRouter';
import { mergeRouters } from './trpc';

export const appRouter = mergeRouters(subscriptionRouter);

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Commonwealth OpenAPI',
  version: '1.0.0',
  baseUrl: `${SERVER_URL}/trpc`,
});

export type AppRouter = typeof appRouter;
