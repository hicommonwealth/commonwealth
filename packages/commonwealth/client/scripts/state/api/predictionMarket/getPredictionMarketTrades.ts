import { trpc } from 'client/scripts/utils/trpcClient';

type GetPredictionMarketTradesParams = {
  prediction_market_id: number;
  limit?: number;
  cursor?: number;
};

const useGetPredictionMarketTradesQuery = (
  params: GetPredictionMarketTradesParams,
) => {
  return trpc.predictionMarket.getPredictionMarketTrades.useQuery(
    {
      ...params,
      cursor: params.cursor ?? 1,
      limit: params.limit ?? 20,
    },
    { enabled: !!params.prediction_market_id },
  );
};

export default useGetPredictionMarketTradesQuery;
