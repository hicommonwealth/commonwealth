import { trpc } from 'utils/trpcClient';

const useSetUserTierMutation = () => {
  return trpc.superAdmin.setUserTier.useMutation({});
};

export default useSetUserTierMutation;
