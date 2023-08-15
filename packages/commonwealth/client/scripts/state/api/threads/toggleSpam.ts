import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

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
  const method = isSpam ? 'put' : 'delete';
  return await axios[method](`${app.serverUrl()}/threads/${threadId}/spam`, {
    data: {
      jwt: app.user.jwt,
      chain_id: chainId,
    } as any,
  });
};

interface ToggleThreadSpamMutationProps {
  chainId: string;
  threadId: number;
}

const useToggleThreadSpamMutation = ({
  chainId,
  threadId,
}: ToggleThreadSpamMutationProps) => {
  return useMutation({
    mutationFn: toggleThreadSpam,
    onSuccess: async (response) => {
      updateThreadInAllCaches(chainId, threadId, {
        markedAsSpamAt: response.data.result.markedAsSpamAt,
      });
      return response.data.result;
    },
  });
};

export default useToggleThreadSpamMutation;
