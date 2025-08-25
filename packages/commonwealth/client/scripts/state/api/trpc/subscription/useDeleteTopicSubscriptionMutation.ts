import { trpc } from 'utils/trpcClient';

export function useDeleteTopicSubscriptionMutation() {
  const utils = trpc.useUtils();
  return trpc.subscriptions.deleteTopicSubscription.useMutation({
    onSuccess: async () => {
      await utils.subscriptions.getTopicSubscriptions.invalidate();
      await utils.subscriptions.getSubscribableTopics.invalidate();
    },
  });
}
