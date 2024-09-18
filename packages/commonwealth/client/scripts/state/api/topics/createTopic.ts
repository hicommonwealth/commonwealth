import { trpc } from 'client/scripts/utils/trpcClient';
import { ApiEndpoints, queryClient } from 'state/api/config';

const useCreateTopicMutation = () => {
  return trpc.community.createTopic.useMutation({
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BULK_TOPICS, response.topic.community_id],
      });
    },
  });
};

export default useCreateTopicMutation;
