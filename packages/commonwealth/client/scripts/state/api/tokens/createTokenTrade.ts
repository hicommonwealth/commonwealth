import { trpc } from 'utils/trpcClient';

const useCreateTokenTradeMutation = () => {
  const utils = trpc.useUtils();

  return trpc.launchpadToken.createTrade.useMutation({
    onSuccess: async () => {
      await utils.launchpadToken.getTokens.invalidate();
      await utils.launchpadToken.getToken.invalidate();
    },
  });
};

export default useCreateTokenTradeMutation;
