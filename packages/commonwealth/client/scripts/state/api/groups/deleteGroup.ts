import { trpc } from 'client/scripts/utils/trpcClient';

const useDeleteGroupMutation = ({ communityId }: { communityId: string }) => {
  const utils = trpc.useUtils();
  return trpc.community.deleteGroup.useMutation({
    onSuccess: async () => {
      utils.community.getGroups.invalidate({ community_id: communityId });
    },
  });
};

export default useDeleteGroupMutation;
