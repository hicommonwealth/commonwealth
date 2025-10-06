import { trpc } from 'utils/trpcClient';

const useUpdateCommunityIdMutation = () => {
  return trpc.superAdmin.updateCommunityId.useMutation({});
};

export default useUpdateCommunityIdMutation;
