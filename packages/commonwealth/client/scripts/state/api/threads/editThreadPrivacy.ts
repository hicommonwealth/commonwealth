import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface EditThreadPrivacyProps {
  chainId: string;
  threadId: number;
  readOnly: boolean
}

const editThreadPrivacy = async ({
  chainId,
  threadId,
  readOnly
}: EditThreadPrivacyProps) => {
  const response = await axios.post(`${app.serverUrl()}/updateThreadPrivacy`, {
    thread_id: threadId,
    read_only: readOnly,
    jwt: app.user.jwt,
  })

  return new Thread(response.data.result)
};

interface UseEditThreadPrivacyMutationProps {
  chainId: string
  threadId: number;
}

const useEditThreadPrivacyMutation = ({ chainId, threadId }: UseEditThreadPrivacyMutationProps) => {
  return useMutation({
    mutationFn: editThreadPrivacy,
    onSuccess: async (updatedThread) => {
      updateThreadInAllCaches(chainId, threadId, updatedThread)
      return updatedThread;
    }
  });
};

export default useEditThreadPrivacyMutation;
