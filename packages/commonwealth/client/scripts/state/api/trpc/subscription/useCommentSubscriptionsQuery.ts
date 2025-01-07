import { trpc } from 'utils/trpcClient';

export function useCommentSubscriptionsQuery() {
  return trpc.subscriptions.getCommentSubscriptions.useQuery({});
}
