import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import app from 'state';

interface ToggleThreadSpamProps {
  chainId: string;
  threadId: number;
  isSpam: boolean;
}

const toggleThreadSpam = async ({
  chainId,
  threadId,
  isSpam,
}: ToggleThreadSpamProps) => {
  const method = isSpam ? 'put' : 'delete'
  return await axios[method](`${app.serverUrl()}/threads/${threadId}/spam`, {
    data: {
      jwt: app.user.jwt,
      chain_id: chainId,
    } as any,
  })
};

interface ToggleThreadSpamMutationProps {
  chainId: string
  threadId: number;
}

const useToggleThreadSpamMutation = ({ chainId, threadId }: ToggleThreadSpamMutationProps) => {
  return useMutation({
    mutationFn: toggleThreadSpam,
    onSuccess: async (response) => {
      // TODO: migrate the thread store objects, then clean this up
      const foundThread = app.threads.store.getByIdentifier(threadId);
      foundThread.markedAsSpamAt = response.data.result.markedAsSpamAt;
      app.threads.updateThreadInStore(new Thread({ ...foundThread }));

      return foundThread
    }
  });
};

export default useToggleThreadSpamMutation;
