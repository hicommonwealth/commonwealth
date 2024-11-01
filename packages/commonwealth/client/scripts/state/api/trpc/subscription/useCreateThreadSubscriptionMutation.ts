import { trpc } from 'utils/trpcClient';

export function useCreateThreadSubscriptionMutation() {
  return trpc.subscriptions.createThreadSubscription.useMutation();
}
