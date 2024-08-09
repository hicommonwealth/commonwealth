import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Thread, { Link } from 'models/Thread';
import { SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';
import { updateThreadInAllCaches } from './helpers/cache';

interface AddThreadLinksProps {
  communityId: string;
  threadId: number;
  links: Link[];
  isPWA?: boolean;
}

const addThreadLinks = async ({
  threadId,
  links,
  isPWA,
}: AddThreadLinksProps): Promise<Thread> => {
  const response = await axios.post(
    `${SERVER_URL}/linking/addThreadLinks`,
    {
      thread_id: threadId,
      links,
      jwt: userStore.getState().jwt,
    },
    {
      headers: {
        isPWA: isPWA?.toString(),
      },
    },
  );

  return new Thread(response.data.result);
};

interface UseAddThreadLinksMutationProps {
  communityId: string;
  threadId: number;
  isPWA?: boolean;
}

const useAddThreadLinksMutation = ({
  communityId,
  threadId,
}: UseAddThreadLinksMutationProps) => {
  return useMutation({
    mutationFn: addThreadLinks,
    onSuccess: async (updatedThread) => {
      updateThreadInAllCaches(communityId, threadId, updatedThread);
      return updatedThread;
    },
  });
};

export default useAddThreadLinksMutation;
