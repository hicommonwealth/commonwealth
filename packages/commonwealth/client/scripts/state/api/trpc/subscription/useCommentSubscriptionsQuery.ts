import { trpc } from 'utils/trpcClient';

const SUBSCRIPTIONS_STALE_TIME = 30 * 1_000; // 30s

export function useCommentSubscriptionsQuery() {
  return trpc.subscriptions.getCommentSubscriptions.useQuery(
    {},
    {
      staleTime: SUBSCRIPTIONS_STALE_TIME,
    },
  );
}
