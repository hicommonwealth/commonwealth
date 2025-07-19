import { trpc } from 'utils/trpcClient';

const useCreateTokenTradeMutation = () => {
  const utils = trpc.useUtils();

  return trpc.LaunchpadToken.createTrade.useMutation({
    onSuccess: async () => {
      await utils.LaunchpadToken.getTokens.invalidate();
      await utils.LaunchpadToken.getToken.invalidate();
    },
  });
};

export default useCreateTokenTradeMutation;
