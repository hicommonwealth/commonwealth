import { trpc } from 'utils/trpcClient';

export function useSubscriptionPreferences() {
  return trpc.subscriptions.getSubscriptionPreferences.useQuery({});
}
