import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '../../../server/trpc/rootRouter';
import app from '../state/index';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: '/trpc',
      async headers() {
        return {
          authorization: app.user.jwt,
        };
      },
    }),
  ],
});
