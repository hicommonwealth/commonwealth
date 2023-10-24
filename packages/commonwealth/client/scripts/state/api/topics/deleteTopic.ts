import axios from 'axios';
import app from 'state';
import { useMutation } from '@tanstack/react-query';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface DeleteTopicProps {
  topicId: number;
  chainId: string;
  topicName: string;
}

const deleteTopic = async ({ topicId, chainId }: DeleteTopicProps) => {
  await axios.delete(`${app.serverUrl()}/topics/${topicId}`, {
    data: {
      chain: chainId,
      jwt: app.user.jwt,
    },
  });
};

const useDeleteTopicMutation = () => {
  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BULK_TOPICS, variables.chainId],
      });
      // TODO: add a new method in thread cache to deal with this
      // await app.threads.listingStore.removeTopic(variables.topicName);
    },
  });
};

export default useDeleteTopicMutation;
