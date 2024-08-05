import { trpc } from 'utils/trpcClient';

export function useCreateThreadSubscriptionMutation() {
  return trpc.subscription.createThreadSubscription.useMutation();
}
