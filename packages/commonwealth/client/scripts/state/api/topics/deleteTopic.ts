import { trpc } from 'utils/trpcClient';

const useToggleArchiveTopicMutation = () => {
  const utils = trpc.useUtils();
  return trpc.community.toggleArchiveTopic.useMutation({
    onSuccess: async (response) => {
      await utils.community.getTopics.invalidate({
        community_id: response.community_id,
      });
      // TODO: add a new method in thread cache to deal with this
      // await app.threads.listingStore.removeTopic(variables.topicName);
    },
  });
};

export default useToggleArchiveTopicMutation;
