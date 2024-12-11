import { trpc } from 'utils/trpcClient';

const usePinTokenToCommunityMutation = () => {
  const utils = trpc.useUtils();

  return trpc.community.pinToken.useMutation({
    onSuccess: () => {
      utils.community.getPinnedTokens.invalidate();
    },
  });
};

export default usePinTokenToCommunityMutation;
