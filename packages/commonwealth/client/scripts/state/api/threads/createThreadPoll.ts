import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, queryClient, SERVER_URL } from 'state/api/config';
import { updateThreadInAllCaches } from 'state/api/threads/helpers/cache';
import { userStore } from 'state/ui/user';

interface CreateThreadPollProps {
  threadId: number;
  prompt: string;
  options: string[];
  customDuration?: string;
  authorCommunity: string;
  address: string;
}

const createThreadPoll = async ({
  threadId,
  prompt,
  options,
  customDuration,
  authorCommunity,
  address,
}: CreateThreadPollProps) => {
  const response = await axios.post(`${SERVER_URL}/threads/${threadId}/polls`, {
    community_id: app.activeChainId(),
    author_chain: authorCommunity,
    address,
    jwt: userStore.getState().jwt,
    prompt,
    options,
    custom_duration: customDuration?.split(' ')[0],
  });

  return response.data.result;
};

const useCreateThreadPollMutation = () => {
  return useMutation({
    mutationFn: createThreadPoll,
    onSuccess: async (data) => {
      updateThreadInAllCaches(data.community_id, data.thread_id, {
        hasPoll: true,
      });

      await queryClient.invalidateQueries({
        queryKey: [
          ApiEndpoints.fetchThreadPolls(data.thread_id),
          data.community_id,
        ],
      });
    },
  });
};

export default useCreateThreadPollMutation;
