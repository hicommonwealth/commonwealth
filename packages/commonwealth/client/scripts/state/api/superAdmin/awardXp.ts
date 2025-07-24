import { trpc } from 'utils/trpcClient';

const useAwardXpMutation = () => {
  return trpc.superAdmin.awardXp.useMutation({});
};

export default useAwardXpMutation;
