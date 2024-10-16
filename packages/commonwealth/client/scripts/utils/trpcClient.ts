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
        return {
          authorization: user.jwt || '',
          isPWA: user.isOnPWA?.toString(),
          address:
            user.addressSelectorSelectedAddress ??
            user.activeAccount?.address ??
            user.addresses?.at(0)?.address,
        };
      },
    }),
  ],
  transformer: undefined,
});
