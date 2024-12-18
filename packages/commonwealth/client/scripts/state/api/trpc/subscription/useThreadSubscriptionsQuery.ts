import { trpc } from 'utils/trpcClient';

export function useThreadSubscriptionsQuery() {
  return trpc.subscriptions.getThreadSubscriptions.useQuery({});
}
