import { trpc } from 'client/scripts/utils/trpcClient';

const useResolvePredictionMarketMutation = () => {
  const utils = trpc.useUtils();
  return trpc.predictionMarket.resolvePredictionMarket.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.predictionMarket.getPredictionMarkets.invalidate({
        thread_id: variables.thread_id,
      });
    },
  });
};

export default useResolvePredictionMarketMutation;
