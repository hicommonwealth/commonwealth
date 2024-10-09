import { trpc } from 'utils/trpcClient';

export function useSubscriptionPreferences() {
  return trpc.subscription.getSubscriptionPreferences.useQuery({});
}
