import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Thread, { Link } from 'models/Thread';
import { SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';
import { updateThreadInAllCaches } from './helpers/cache';

interface DeleteThreadLinksProps {
  communityId: string;
  threadId: number;
  links: Link[];
}

const deleteThreadLinks = async ({
  threadId,
  links,
}: DeleteThreadLinksProps): Promise<Thread> => {
  const response = await axios.delete(`${SERVER_URL}/linking/deleteLinks`, {
    data: {
      thread_id: threadId,
      links,
      jwt: userStore.getState().jwt,
    },
  });

  return new Thread(response.data.result);
};

interface DeleteThreadLinksMutationProps {
  communityId: string;
  threadId: number;
}

const useDeleteThreadLinksMutation = ({
  communityId,
  threadId,
}: DeleteThreadLinksMutationProps) => {
  return useMutation({
    mutationFn: deleteThreadLinks,
    onSuccess: async (updatedThread) => {
      updateThreadInAllCaches(communityId, threadId, updatedThread);
      return updatedThread;
    },
  });
};

export default useDeleteThreadLinksMutation;
