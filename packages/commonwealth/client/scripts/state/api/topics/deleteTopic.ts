import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, SERVER_URL, queryClient } from 'state/api/config';
import { userStore } from '../../ui/user';

interface DeleteTopicProps {
  topicId: number;
  communityId: string;
  topicName: string;
}

const deleteTopic = async ({ topicId, communityId }: DeleteTopicProps) => {
  await axios.delete(`${SERVER_URL}/topics/${topicId}`, {
    data: {
      community_id: communityId,
      jwt: userStore.getState().jwt,
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
