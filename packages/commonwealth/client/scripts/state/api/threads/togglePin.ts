import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface ToggleThreadPinProps {
  chainId: string;
  threadId: number;
}

const toggleThreadPin = async ({
  chainId,
  threadId
}: ToggleThreadPinProps) => {
  const response = await axios.post(`${app.serverUrl()}/updateThreadPinned`, {
    jwt: app.user.jwt,
    thread_id: threadId,
  })

  return app.threads.modelFromServer(response.data.result)
};

interface ToggleThreadPinMutationProps {
  chainId: string
  threadId: number;
}

const useToggleThreadPinMutation = ({ chainId, threadId }: ToggleThreadPinMutationProps) => {
  return useMutation({
    mutationFn: toggleThreadPin,
    onSuccess: async (updatedThread) => {
      console.log("updatedThread => ", updatedThread)
      // TODO: migrate the thread store objects, then clean this up
      // Post edits propagate to all thread stores
      app.threads._listingStore.add(updatedThread);
      app.threads.store.add(updatedThread);
      return updatedThread;
    }
  });
};

export default useToggleThreadPinMutation;
