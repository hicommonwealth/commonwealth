import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

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
      // TODO: migrate the thread store objects, then clean this up
      // Deleted posts are removed from all stores containing them
      const oldThread = app.threads.store.getByIdentifier(threadId)
      app.threads.store.remove(oldThread);
      app.threads._listingStore.remove(oldThread);
      app.threads._overviewStore.remove(oldThread);
      app.threads.numTotalThreads -= 1;

      return response.data
    }
  });
};

export default useDeleteThreadMutation;
