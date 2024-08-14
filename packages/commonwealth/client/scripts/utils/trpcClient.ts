import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { API } from '../../../server/api/internal-router';
import { userStore } from '../state/ui/user';

export const trpc = createTRPCReact<API>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/internal/trpc',
      async headers() {
        return {
          authorization: userStore.getState().jwt || '',
          address_id: userStore.getState().activeAccount?.address,
        };
      },
    }),
  ],
  transformer: undefined,
});
