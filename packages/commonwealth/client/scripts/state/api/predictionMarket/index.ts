import useCreatePredictionMarketMutation from './createPredictionMarket';
import useDeployPredictionMarketMutation from './deployPredictionMarket';
import useDiscoverPredictionMarketsQuery, {
  type DiscoverPredictionMarketsFilters,
  type PredictionMarketStatusFilter,
} from './discoverPredictionMarkets';
import useGetPredictionMarketPositionsQuery from './getPredictionMarketPositions';
import useGetPredictionMarketsQuery from './getPredictionMarkets';
import useGetPredictionMarketTradesQuery from './getPredictionMarketTrades';

export {
  useCreatePredictionMarketMutation,
  useDeployPredictionMarketMutation,
  useDiscoverPredictionMarketsQuery,
  useGetPredictionMarketPositionsQuery,
  useGetPredictionMarketTradesQuery,
  useGetPredictionMarketsQuery,
};
export type { DiscoverPredictionMarketsFilters, PredictionMarketStatusFilter };
