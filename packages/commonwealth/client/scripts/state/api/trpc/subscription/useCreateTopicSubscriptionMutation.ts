import { trpc } from 'utils/trpcClient';

export function useCreateTopicSubscriptionMutation() {
  const utils = trpc.useUtils();
  return trpc.subscriptions.createTopicSubscription.useMutation({
    onSuccess: async () => {
      await utils.subscriptions.getTopicSubscriptions.invalidate();
      await utils.subscriptions.getSubscribableTopics.invalidate();
    },
  });
}
