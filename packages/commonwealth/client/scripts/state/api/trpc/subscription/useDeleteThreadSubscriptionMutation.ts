import { trpc } from 'utils/trpcClient';

export function useDeleteThreadSubscriptionMutation() {
  return trpc.subscriptions.deleteThreadSubscription.useMutation();
}
