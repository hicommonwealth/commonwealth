import { trpc } from 'utils/trpcClient';

export const useCreateGoalMetaMutation = () => {
  const utils = trpc.useUtils();
  return trpc.superAdmin.createCommunityGoalMeta.useMutation({
    onSuccess: () => {
      utils.superAdmin.getCommunityGoalMetas.invalidate();
    },
  });
};
