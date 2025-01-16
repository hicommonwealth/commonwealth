import { trpc } from 'utils/trpcClient';

const useCreateTokenTradeMutation = () => {
  const utils = trpc.useUtils();

  return trpc.launchpadToken.createTrade.useMutation({
    onSuccess: async () => {
      await utils.launchpadToken.getTokens.invalidate();
      await utils.launchpadToken.getTokens.refetch();
      await utils.launchpadToken.getToken.invalidate();
      await utils.launchpadToken.getToken.refetch();
    },
  });
};

export default useCreateTokenTradeMutation;
