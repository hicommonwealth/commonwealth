import { trpc } from 'client/scripts/utils/trpcClient';

// predictionMarket router is conditionally registered when MARKETS.FUTARCHY_ENABLED
const useCreatePredictionMarketMutation = () => {
  const utils = trpc.useUtils();
  return trpc.predictionMarket.createPredictionMarket.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.predictionMarket.getPredictionMarkets.invalidate({
        thread_id: variables.thread_id,
      });
    },
  });
};

export default useCreatePredictionMarketMutation;
