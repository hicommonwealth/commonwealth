import { trpc } from 'utils/trpcClient';

export function useCreateCommentSubscriptionMutation() {
  return trpc.subscriptions.createCommentSubscription.useMutation();
}
