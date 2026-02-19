import { trpc } from 'client/scripts/utils/trpcClient';

interface UseCancelPredictionMarketMutationProps {
  threadId: number;
}

const useCancelPredictionMarketMutation = ({
  threadId,
}: UseCancelPredictionMarketMutationProps) => {
  const utils = trpc.useUtils();
  return trpc.predictionMarket.cancelPredictionMarket.useMutation({
    onSuccess: () => {
      utils.predictionMarket.getPredictionMarkets
        .invalidate({ thread_id: threadId })
        .catch(console.error);
    },
  });
};

export default useCancelPredictionMarketMutation;
