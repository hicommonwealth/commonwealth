import { trpc } from 'utils/trpcClient';

export function useUpdateSubscriptionPreferencesMutation() {
  return trpc.subscriptions.updateSubscriptionPreferences.useMutation();
}
