import { trpc } from 'client/scripts/utils/trpcClient';

type GetActivePredictionMarketsParams = {
  community_id?: string;
  limit?: number;
};

const useGetActivePredictionMarketsQuery = (
  params: GetActivePredictionMarketsParams,
) => {
  return trpc.predictionMarket.getActivePredictionMarkets.useQuery(params, {
    enabled: true,
  });
};

export default useGetActivePredictionMarketsQuery;
