import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { ApiV1 } from '../../../server/api/index';
import { userStore } from '../state/ui/user';

export const trpc = createTRPCReact<ApiV1>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/v1',
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
