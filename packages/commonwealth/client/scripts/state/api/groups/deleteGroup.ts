import { trpc } from 'client/scripts/utils/trpcClient';
import { ApiEndpoints, queryClient } from '../config';

const useDeleteGroupMutation = ({ communityId }: { communityId: string }) => {
  return trpc.community.deleteGroup.useMutation({
    onSuccess: async () => {
      const key = [ApiEndpoints.FETCH_GROUPS, communityId];
      queryClient.cancelQueries(key);
      queryClient.refetchQueries(key);
    },
  });
};

export default useDeleteGroupMutation;
