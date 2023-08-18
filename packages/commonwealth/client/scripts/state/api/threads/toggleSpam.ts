import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface ToggleThreadSpamProps {
  chainId: string;
  threadId: number;
  isSpam: boolean;
  address: string;
}

const toggleThreadSpam = async ({
  chainId,
  threadId,
  isSpam,
  address,
}: ToggleThreadSpamProps) => {
  return await axios.patch(`${app.serverUrl()}/threads/${threadId}`, {
    author_chain: chainId,
    chain: chainId,
    address: address,
    jwt: app.user.jwt,
    spam: isSpam,
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
        markedAsSpamAt: response.data.result.marked_as_spam_at,
      });
      return response.data.result;
    },
  });
};

export default useToggleThreadSpamMutation;
