import { trpc } from 'utils/trpcClient';

const useEditTopicMutation = () => {
  const utils = trpc.useUtils();
  return trpc.community.updateTopic.useMutation({
    onSuccess: async (response) => {
      await utils.community.getTopics.invalidate({
        community_id: response.topic.community_id,
      });
    },
  });
};

export default useEditTopicMutation;
