import { trpc } from 'utils/trpcClient';
import { invalidateAllQueriesForCommunity } from './getCommuityById';

const useEditCommunityTokenMutation = () => {
  return trpc.community.updateCommunity.useMutation({
    onSuccess: async ({ id }) => {
      await invalidateAllQueriesForCommunity(id);
    },
  });
};

export default useEditCommunityTokenMutation;
