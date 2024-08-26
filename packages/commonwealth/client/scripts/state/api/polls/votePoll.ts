import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, queryClient, SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';

interface VotePollProps {
  pollId: number;
  communityId: string;
  authorCommunityId: string;
  address: string;
  selectedOption: string;
}

const votePoll = async ({
  pollId,
  communityId,
  authorCommunityId,
  address,
  selectedOption,
}: VotePollProps) => {
  const response = await axios.put(`${SERVER_URL}/polls/${pollId}/votes`, {
    poll_id: pollId,
    chain_id: communityId,
    author_chain: authorCommunityId,
    option: selectedOption,
    address,
    jwt: userStore.getState().jwt,
  });

  return response.data.result;
};

interface UseVotePollMutationProps {
  threadId: number;
}

const useVotePollMutation = ({ threadId }: UseVotePollMutationProps) => {
  return useMutation({
    mutationFn: votePoll,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [
          ApiEndpoints.fetchThreadPolls(threadId),
          variables.communityId,
        ],
      });
    },
  });
};

export default useVotePollMutation;
