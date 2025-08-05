import { trpc } from 'utils/trpcClient';

const GET_TOPIC_SUBSCRIPTIONS_STALE_TIME = 5 * 60 * 1_000; // 5 min

export function useTopicSubscriptionsQuery() {
  return trpc.subscriptions.getTopicSubscriptions.useQuery(
    {},
    {
      gcTime: GET_TOPIC_SUBSCRIPTIONS_STALE_TIME,
      staleTime: GET_TOPIC_SUBSCRIPTIONS_STALE_TIME,
    },
  );
}
