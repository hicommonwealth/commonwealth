import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { ApiV1 } from '../../../server/api/index';
import app from '../state/index';

export const trpc = createTRPCReact<ApiV1>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/v1',
      async headers() {
        return {
          authorization: app.user.jwt,
        };
      },
    }),
  ],
  transformer: undefined,
});
