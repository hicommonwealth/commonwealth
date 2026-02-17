import { trpc } from 'utils/trpcClient';

const useDeployPredictionMarketMutation = () => {
  const utils = trpc.useUtils();
  return (trpc as any).predictionMarket.deployPredictionMarket.useMutation({
    onSuccess: async (data: { thread_id: number }) => {
      await (utils as any).predictionMarket.getPredictionMarkets.invalidate({
        thread_id: data.thread_id,
      });
    },
  });
};

export default useDeployPredictionMarketMutation;
