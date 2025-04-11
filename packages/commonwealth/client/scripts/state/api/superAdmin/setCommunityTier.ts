import { trpc } from 'utils/trpcClient';

const useSetCommunityTierMutation = () => {
  return trpc.superAdmin.setCommunityTier.useMutation({});
};

export default useSetCommunityTierMutation;
