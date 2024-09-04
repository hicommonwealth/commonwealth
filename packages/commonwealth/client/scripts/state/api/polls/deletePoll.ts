import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, queryClient, SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';

interface DeletePollProps {
  authorCommunity: string;
  address: string;
  pollId: number;
}

const deletePoll = async ({
  authorCommunity,
  address,
  pollId,
}: DeletePollProps) => {
  await axios.delete(`${SERVER_URL}/polls/${pollId}`, {
    data: {
      community_id: app.activeChainId(),
      author_chain: authorCommunity,
      address,
      jwt: userStore.getState().jwt,
      poll_id: pollId,
    },
  });
};

interface UseDeletePollMutationProps {
  threadId: number;
}

const useDeletePollMutation = ({ threadId }: UseDeletePollMutationProps) => {
  return useMutation({
    mutationFn: deletePoll,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          ApiEndpoints.fetchThreadPolls(threadId),
          app.activeChainId(),
        ],
      });
    },
  });
};

export default useDeletePollMutation;
