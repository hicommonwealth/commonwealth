import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { ApiV1 } from '../../../server/api/index';
import app from '../state/index';

export const trpc = createTRPCReact<ApiV1>();

console.log('FIXME: on the client bro.5');

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/v1',
      async headers() {
        return {
          authorization: app.user.jwt,
          address_id: app?.user?.activeAccount?.address,
        };
      },
    }),
  ],
  transformer: undefined,
});

console.log('FIXME.8: ', trpc.subscription.getCommentSubscriptions.useQuery);
