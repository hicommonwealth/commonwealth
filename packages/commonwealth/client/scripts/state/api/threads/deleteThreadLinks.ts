import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'models/Thread';
import app from 'state';

interface deleteThreadLinksProps {
  chainId: string;
  threadId: number;
  links: Link[];
}

const deleteThreadLinks = async ({
  chainId,
  threadId,
  links
}: deleteThreadLinksProps) => {
  const response = await axios.post(`${app.serverUrl()}/linking/deleteLinks`, {
    data: {
      thread_id: threadId,
      links,
      jwt: app.user.jwt,
    },
  })

  return app.threads.modelFromServer(response.data.result)
};

interface deleteThreadLinksMutationProps {
  chainId: string
  threadId: number;
}

const useDeleteThreadLinksMutation = ({ chainId, threadId }: deleteThreadLinksMutationProps) => {
  return useMutation({
    mutationFn: deleteThreadLinks,
    onSuccess: async (updatedThread) => {
      // TODO: migrate the thread store objects, then clean this up
      app.threads._listingStore.remove(updatedThread);
      app.threads._listingStore.add(updatedThread);

      return updatedThread
    }
  });
};

export default useDeleteThreadLinksMutation;
