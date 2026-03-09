import useCreatePredictionMarketMutation from './createPredictionMarket';
import useDeployPredictionMarketMutation from './deployPredictionMarket';
import useDiscoverPredictionMarketsQuery, {
  type DiscoverPredictionMarketsFilters,
  type PredictionMarketStatusFilter,
} from './discoverPredictionMarkets';
import useGetActivePredictionMarketsQuery from './getActivePredictionMarkets';
import useGetPredictionMarketPositionsQuery from './getPredictionMarketPositions';
import useGetPredictionMarketsQuery from './getPredictionMarkets';
import useGetPredictionMarketTradesQuery from './getPredictionMarketTrades';
import useResolvePredictionMarketMutation from './resolvePredictionMarket';

export {
  useCreatePredictionMarketMutation,
  useDeployPredictionMarketMutation,
  useDiscoverPredictionMarketsQuery,
  useGetActivePredictionMarketsQuery,
  useGetPredictionMarketPositionsQuery,
  useGetPredictionMarketsQuery,
  useGetPredictionMarketTradesQuery,
  useResolvePredictionMarketMutation,
};
export type { DiscoverPredictionMarketsFilters, PredictionMarketStatusFilter };
