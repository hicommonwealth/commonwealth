import { Thread, ThreadView } from 'models/Thread';
import { trpc } from 'utils/trpcClient';
import { updateThreadInAllCaches } from './helpers/cache';

const useDeleteThreadLinksMutation = () => {
  return trpc.thread.deleteLinks.useMutation({
    onSuccess: (updated) => {
      const thread = new Thread(updated as ThreadView);
      updateThreadInAllCaches(updated.community_id, updated.id!, thread);
      return updated;
    },
  });
};

export default useDeleteThreadLinksMutation;
