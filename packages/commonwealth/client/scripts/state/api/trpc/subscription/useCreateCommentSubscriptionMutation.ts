import { trpc } from 'utils/trpcClient';

export function useCreateCommentSubscriptionMutation() {
  return trpc.subscription.createCommentSubscription.useMutation();
}
