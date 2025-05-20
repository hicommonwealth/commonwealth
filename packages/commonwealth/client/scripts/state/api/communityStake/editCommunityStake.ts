import { trpc } from 'utils/trpcClient';

const useSetCommunityStakeMutation = () => {
  return trpc.community.setCommunityStake.useMutation({});
};

export default useSetCommunityStakeMutation;
