import { trpc } from 'client/scripts/utils/trpcClient';

const useDeployPredictionMarketMutation = () => {
  const utils = trpc.useUtils();
  return trpc.predictionMarket.deployPredictionMarket.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.predictionMarket.getPredictionMarkets.invalidate({
        thread_id: variables.thread_id,
      });
    },
  });
};

export default useDeployPredictionMarketMutation;
