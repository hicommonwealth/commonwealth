import type { DiscoverPredictionMarketsFilters } from 'state/api/predictionMarket';

export type PredictionMarketFilters = DiscoverPredictionMarketsFilters;
export type PredictionMarketStatusFilter =
  DiscoverPredictionMarketsFilters['statuses'][number];

export type FiltersDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: PredictionMarketFilters;
  onFiltersChange: (newFilters: PredictionMarketFilters) => void;
};
