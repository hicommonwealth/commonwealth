import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface DeleteTopicProps {
  topicId: number;
  communityId: string;
  topicName: string;
}

const deleteTopic = async ({ topicId, communityId }: DeleteTopicProps) => {
  await axios.delete(`${app.serverUrl()}/topics/${topicId}`, {
    data: {
      community_id: communityId,
      jwt: app.user.jwt,
    },
  });
};

const useDeleteTopicMutation = () => {
  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BULK_TOPICS, variables.communityId],
      });
      // TODO: add a new method in thread cache to deal with this
      // await app.threads.listingStore.removeTopic(variables.topicName);
    },
  });
};

export default useDeleteTopicMutation;
