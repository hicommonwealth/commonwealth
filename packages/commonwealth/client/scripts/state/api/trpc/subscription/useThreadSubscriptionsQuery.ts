import { trpc } from 'utils/trpcClient';

const GET_THREAD_SUBSCRIPTIONS_STALE_TIME = 5 * 60 * 1_000; // 5 min

export function useThreadSubscriptionsQuery() {
  return trpc.subscriptions.getThreadSubscriptions.useQuery(
    {},
    {
      gcTime: GET_THREAD_SUBSCRIPTIONS_STALE_TIME,
      staleTime: GET_THREAD_SUBSCRIPTIONS_STALE_TIME,
    },
  );
}
