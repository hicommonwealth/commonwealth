import { trpc } from 'utils/trpcClient';

type GetPredictionMarketsParams = {
  thread_id: number;
  limit?: number;
  cursor?: number;
};

const useGetPredictionMarketsQuery = (params: GetPredictionMarketsParams) => {
  return trpc.predictionMarket.getPredictionMarkets.useQuery(
    { ...params, cursor: params.cursor ?? 1 },
    { enabled: !!params.thread_id },
  );
};

export default useGetPredictionMarketsQuery;
