import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'models/Thread';
import app from 'state';

interface AddThreadLinksProps {
  chainId: string;
  threadId: number;
  links: Link[];
}

const addThreadLinks = async ({
  chainId,
  threadId,
  links
}: AddThreadLinksProps) => {
  const response = await axios.post(`${app.serverUrl()}/linking/addThreadLinks`, {
    thread_id: threadId,
    links,
    jwt: app.user.jwt,
  })

  return app.threads.modelFromServer(response.data.result)
};

interface UseAddThreadLinksMutationProps {
  chainId: string
  threadId: number;
}

const useAddThreadLinksMutation = ({ chainId, threadId }: UseAddThreadLinksMutationProps) => {
  return useMutation({
    mutationFn: addThreadLinks,
    onSuccess: async (updatedThread) => {
      // TODO: migrate the thread store objects, then clean this up
      app.threads._listingStore.remove(updatedThread);
      app.threads._listingStore.add(updatedThread);

      return updatedThread
    }
  });
};

export default useAddThreadLinksMutation;
