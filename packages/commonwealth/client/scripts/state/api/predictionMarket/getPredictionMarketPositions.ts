import { trpc } from 'client/scripts/utils/trpcClient';

type GetPredictionMarketPositionsParams = {
  prediction_market_id: number;
};

const useGetPredictionMarketPositionsQuery = (
  params: GetPredictionMarketPositionsParams,
) => {
  return trpc.predictionMarket.getPredictionMarketPositions.useQuery(params, {
    enabled: !!params.prediction_market_id,
    staleTime: 30 * 1000,
  });
};

export default useGetPredictionMarketPositionsQuery;
