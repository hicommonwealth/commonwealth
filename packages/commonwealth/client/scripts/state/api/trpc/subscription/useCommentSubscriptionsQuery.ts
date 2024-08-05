import { trpc } from 'utils/trpcClient';

export function useCommentSubscriptionsQuery() {
  return trpc.subscription.getCommentSubscriptions.useQuery({});
}
