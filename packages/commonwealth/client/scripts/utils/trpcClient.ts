import { httpLink } from '@trpc/client';
import { createTRPCQueryUtils, createTRPCReact } from '@trpc/react-query';
import type { API } from '../../../server/api/internal-router';
import { queryClient } from '../state/api/config';
import { userStore } from '../state/ui/user';

// React hooks for tRPC queries and mutations - use these in React components
export const trpc = createTRPCReact<API>();

export const BASE_API_PATH = '/api/internal/trpc';

// tRPC client instance - used internally by React hooks and utils
export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: BASE_API_PATH,
      headers: () => {
        const user = userStore.getState();
        return {
          authorization: user.jwt || '',
          isPWA: user.isOnPWA?.toString(),
          address:
            user.addressSelectorSelectedAddress ||
            user.activeAccount?.address ||
            user.addresses?.at(0)?.address,
        };
      },
    }),
  ],
  transformer: undefined,
});

// tRPC query utilities for non-React contexts (e.g., utility functions, event handlers)
// Use this instead of axios for calling tRPC procedures outside of React components
export const trpcQueryUtils = createTRPCQueryUtils({
  queryClient,
  client: trpcClient,
});
