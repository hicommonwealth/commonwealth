import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Thread, { Link } from 'models/Thread';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface DeleteThreadLinksProps {
  chainId: string;
  threadId: number;
  links: Link[];
}

const deleteThreadLinks = async ({
  threadId,
  links,
}: DeleteThreadLinksProps): Promise<Thread> => {
  const response = await axios.delete(
    `${app.serverUrl()}/linking/deleteLinks`,
    {
      data: {
        thread_id: threadId,
        links,
        jwt: app.user.jwt,
      },
    },
  );

  return new Thread(response.data.result);
};

interface DeleteThreadLinksMutationProps {
  chainId: string;
  threadId: number;
}

const useDeleteThreadLinksMutation = ({
  chainId,
  threadId,
}: DeleteThreadLinksMutationProps) => {
  return useMutation({
    mutationFn: deleteThreadLinks,
    onSuccess: async (updatedThread) => {
      updateThreadInAllCaches(chainId, threadId, updatedThread);
      return updatedThread;
    },
  });
};

export default useDeleteThreadLinksMutation;
