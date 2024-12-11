import { trpc } from 'utils/trpcClient';

type UseUnpinTokenFromCommunityMutation = {
  resetCacheOnSuccess?: boolean;
};

const useUnpinTokenFromCommunityMutation = ({
  resetCacheOnSuccess = true,
}: UseUnpinTokenFromCommunityMutation = {}) => {
  const utils = trpc.useUtils();

  return trpc.community.unpinToken.useMutation({
    onSuccess: () => {
      resetCacheOnSuccess && utils.community.getPinnedTokens.invalidate();
    },
  });
};

export default useUnpinTokenFromCommunityMutation;
