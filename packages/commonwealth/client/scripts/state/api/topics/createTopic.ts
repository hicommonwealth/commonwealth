import { trpc } from 'utils/trpcClient';

const useCreateTopicMutation = () => {
  const utils = trpc.useUtils();
  return trpc.community.createTopic.useMutation({
    onSuccess: async (response) => {
      await utils.community.getTopics.invalidate({
        community_id: response.topic.community_id,
      });
    },
  });
};

export default useCreateTopicMutation;
