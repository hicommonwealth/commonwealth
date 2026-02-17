import { trpc } from 'utils/trpcClient';

type GetPredictionMarketsParams = {
  thread_id: number;
  limit?: number;
  offset?: number;
};

const useGetPredictionMarketsQuery = (params: GetPredictionMarketsParams) => {
  return (trpc as any).predictionMarket.getPredictionMarkets.useQuery(params, {
    enabled: !!params.thread_id,
  });
};

export default useGetPredictionMarketsQuery;
