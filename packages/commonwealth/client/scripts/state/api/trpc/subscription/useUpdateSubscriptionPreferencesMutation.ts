import { trpc } from 'utils/trpcClient';

export function useUpdateSubscriptionPreferencesMutation() {
  return trpc.subscription.updateSubscriptionPreferences.useMutation();
}
