import { trpc } from 'utils/trpcClient';

export function useDeleteCommentSubscriptionMutation() {
  return trpc.subscriptions.deleteCommentSubscription.useMutation();
}
