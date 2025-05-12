import { Thread, ThreadView } from 'client/scripts/models/Thread';
import { trpc } from 'utils/trpcClient';
import { updateThreadInAllCaches } from './helpers/cache';

const useAddThreadLinksMutation = () => {
  return trpc.thread.addLinks.useMutation({
    onSuccess: async (updated) => {
      const thread = new Thread(updated as ThreadView);
      updateThreadInAllCaches(updated.community_id, updated.id!, thread);
      return thread;
    },
  });
};

export default useAddThreadLinksMutation;
