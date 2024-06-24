import { trpc } from 'utils/trpcClient';

export function useDeleteThreadSubscriptionMutation() {
  return trpc.subscription.deleteThreadSubscription.useMutation();
}
