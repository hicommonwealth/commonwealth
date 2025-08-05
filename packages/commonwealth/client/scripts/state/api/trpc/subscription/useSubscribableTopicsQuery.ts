import { trpc } from 'utils/trpcClient';

const GET_SUBSCRIBABLE_TOPICS_STALE_TIME = 5 * 60 * 1_000; // 5 min

export function useSubscribableTopicsQuery() {
  return trpc.subscriptions.getSubscribableTopics.useQuery(
    {},
    {
      gcTime: GET_SUBSCRIBABLE_TOPICS_STALE_TIME,
      staleTime: GET_SUBSCRIBABLE_TOPICS_STALE_TIME,
    },
  );
}
