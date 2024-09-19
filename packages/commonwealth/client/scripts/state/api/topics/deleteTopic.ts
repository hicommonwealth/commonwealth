import { trpc } from 'client/scripts/utils/trpcClient';
import { ApiEndpoints, queryClient } from 'state/api/config';

const useDeleteTopicMutation = () => {
  return trpc.community.deleteTopic.useMutation({
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BULK_TOPICS, response.community_id],
      });
      // TODO: add a new method in thread cache to deal with this
      // await app.threads.listingStore.removeTopic(variables.topicName);
    },
  });
};

export default useDeleteTopicMutation;
