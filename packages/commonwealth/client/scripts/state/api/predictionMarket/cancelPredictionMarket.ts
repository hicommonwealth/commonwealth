import { trpc } from 'client/scripts/utils/trpcClient';

interface UseCancelPredictionMarketMutationProps {
  thread_id: number;
}

const useCancelPredictionMarketMutation = ({
  thread_id,
}: UseCancelPredictionMarketMutationProps) => {
  const utils = trpc.useUtils();
  return trpc.predictionMarket.cancelPredictionMarket.useMutation({
    onSuccess: () => {
      utils.predictionMarket.getPredictionMarkets
        .invalidate({ thread_id })
        .catch(console.error);
    },
  });
};

export default useCancelPredictionMarketMutation;
