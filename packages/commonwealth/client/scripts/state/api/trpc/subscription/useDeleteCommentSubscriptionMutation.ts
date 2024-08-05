import { trpc } from 'utils/trpcClient';

export function useDeleteCommentSubscriptionMutation() {
  return trpc.subscription.deleteCommentSubscription.useMutation();
}
