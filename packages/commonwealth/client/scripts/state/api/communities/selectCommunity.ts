import { trpc } from 'client/scripts/utils/trpcClient';

export const useSelectCommunityMutation = () => {
  return trpc.community.selectCommunity.useMutation({
    onSuccess: () => {},
  });
};
