import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Thread, { Link } from 'models/Thread';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface AddThreadLinksProps {
  communityId: string;
  threadId: number;
  links: Link[];
}

const addThreadLinks = async ({
  threadId,
  links,
}: AddThreadLinksProps): Promise<Thread> => {
  const response = await axios.post(
    `${app.serverUrl()}/linking/addThreadLinks`,
    {
      thread_id: threadId,
      links,
      jwt: app.user.jwt,
    },
  );

  return new Thread(response.data.result);
};

interface UseAddThreadLinksMutationProps {
  communityId: string;
  threadId: number;
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
