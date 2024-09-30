import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { API } from '../../../server/api/internal-router';
import { userStore } from '../state/ui/user';

export const trpc = createTRPCReact<API>();

export const BASE_API_PATH = '/api/internal/trpc';

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: BASE_API_PATH,
      async headers() {
        const user = userStore.getState();

        const isCreateCommunityFlow =
          window.location.pathname.includes('/createCommunity');

        const address = isCreateCommunityFlow
          ? user.createCommunityAddress
          : (user.activeAccount?.address ?? user.addresses?.at(0)?.address);
        return {
          authorization: user.jwt || '',
          address,
        };
      },
    }),
  ],
  transformer: undefined,
});
