import { trpc } from 'utils/trpcClient';

export function useThreadSubscriptionsQuery() {
  return trpc.subscription.getThreadSubscriptions.useQuery({});
}
