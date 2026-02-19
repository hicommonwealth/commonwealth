import { trpc } from 'client/scripts/utils/trpcClient';

const PREDICTION_MARKETS_STALE_TIME = 30 * 1000; // 30 seconds

interface GetPredictionMarketsProps {
  threadId: number;
  apiCallEnabled?: boolean;
}

const useGetPredictionMarketsQuery = ({
  threadId,
  apiCallEnabled = true,
}: GetPredictionMarketsProps) => {
  return trpc.predictionMarket.getPredictionMarkets.useQuery(
    { thread_id: threadId },
    {
      enabled: apiCallEnabled,
      staleTime: PREDICTION_MARKETS_STALE_TIME,
    },
  );
};

export default useGetPredictionMarketsQuery;
