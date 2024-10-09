import { trpc } from 'utils/trpcClient';

export function useGetSubscriptionPreferences() {
  return trpc.subscription.getSubscriptionPreferences.useQuery({});
}
