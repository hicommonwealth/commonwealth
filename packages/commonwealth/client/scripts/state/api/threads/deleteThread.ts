import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { removeThreadFromAllCaches } from './helpers/cache';

interface DeleteThreadProps {
  chainId: string
  threadId: number
}

const deleteThread = async ({
  chainId,
  threadId
}: DeleteThreadProps) => {
  return await axios.delete(`${app.serverUrl()}/threads/${threadId}`, {
    data: {
      jwt: app.user.jwt,
      chain_id: chainId,
    },
  })
};

interface UseDeleteThreadMutationProps {
  chainId: string
  threadId: number;
}

const useDeleteThreadMutation = ({ chainId, threadId }: UseDeleteThreadMutationProps) => {
  return useMutation({
    mutationFn: deleteThread,
    onSuccess: async (response) => {
      removeThreadFromAllCaches(chainId, threadId)
      // TODO: migrate the thread store objects, then clean this up
      app.threads.numTotalThreads -= 1;
      return response.data
    }
  });
};

export default useDeleteThreadMutation;
