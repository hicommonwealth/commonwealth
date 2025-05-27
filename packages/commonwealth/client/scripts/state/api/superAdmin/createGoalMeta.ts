import { trpc } from 'utils/trpcClient';

export const useCreateGoalMetaMutation = () => {
  return trpc.superAdmin.createCommunityGoalMeta.useMutation();
};
