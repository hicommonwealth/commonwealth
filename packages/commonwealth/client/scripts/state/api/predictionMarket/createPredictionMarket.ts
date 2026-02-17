import { trpc } from 'utils/trpcClient';

// predictionMarket router is conditionally registered when MARKETS.FUTARCHY_ENABLED
const useCreatePredictionMarketMutation = () => {
  const utils = trpc.useUtils();
  return (trpc as any).predictionMarket.createPredictionMarket.useMutation({
    onSuccess: async (data: { thread_id: number }) => {
      await (utils as any).predictionMarket.getPredictionMarkets.invalidate({
        thread_id: data.thread_id,
      });
    },
  });
};

export default useCreatePredictionMarketMutation;
