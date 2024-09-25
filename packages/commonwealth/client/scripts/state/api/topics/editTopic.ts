import { trpc } from 'client/scripts/utils/trpcClient';
import { ApiEndpoints, queryClient } from 'state/api/config';

const useEditTopicMutation = () => {
  return trpc.community.updateTopic.useMutation({
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BULK_TOPICS, data.topic.community_id],
      });
    },
  });
};

export default useEditTopicMutation;
