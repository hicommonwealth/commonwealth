import clsx from 'clsx';
import React, { useEffect, useMemo, useState } from 'react';
import {
  useDiscoverPredictionMarketsQuery,
  type DiscoverPredictionMarketsFilters,
  type PredictionMarketStatusFilter,
} from 'state/api/predictionMarket';
import { CWText } from '../../../components/component_kit/cw_text';
import { CWButton } from '../../../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWTag } from '../../../components/component_kit/new_designs/CWTag';
import { ExplorePredictionMarketCard } from './ExplorePredictionMarketCard';
import FiltersDrawer from './FiltersDrawer';
import './PredictionMarketsList.scss';

const STATUS_LABELS: Record<PredictionMarketStatusFilter, string> = {
  active: 'Active',
  draft: 'Draft',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

const SORT_OPTIONS = [
  { value: 'recency', label: 'Recency' },
  { value: 'volume', label: 'Volume' },
];

type PredictionMarketsListProps = {
  hideHeader?: boolean;
  hideFilters?: boolean;
  hideSeeMore?: boolean;
  searchText?: string;
  onClearSearch?: () => void;
  hideSearchTag?: boolean;
};

const PredictionMarketsList = ({
  hideHeader,
  hideFilters,
  hideSeeMore,
  searchText,
  onClearSearch,
  hideSearchTag,
}: PredictionMarketsListProps) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<DiscoverPredictionMarketsFilters>({
    statuses: [],
    sort: 'recency',
    search: searchText ?? '',
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchText ?? '',
    }));
  }, [searchText]);

  const {
    data,
    isInitialLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useDiscoverPredictionMarketsQuery({
    filters: {
      ...filters,
      search: filters.search || searchText?.trim() || undefined,
    },
    limit: 20,
    enabled: true,
  });

  const markets = useMemo(
    () => data?.pages.flatMap((p) => p.results) ?? [],
    [data?.pages],
  );

  const hasAppliedFilter =
    filters.statuses.length > 0 ||
    filters.sort !== 'recency' ||
    !!filters.community_id;

  const removeStatusFilter = (status: PredictionMarketStatusFilter) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.filter((s) => s !== status),
    }));
  };

  const removeCommunityFilter = () => {
    setFilters((prev) => ({ ...prev, community_id: undefined }));
  };

  const removeSortFilter = () => {
    setFilters((prev) => ({ ...prev, sort: 'recency' }));
  };

  const handleFetchMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  const isHorizontalScroll = hideFilters;
  const showVolume = !hideFilters;

  return (
    <div className="PredictionMarketsList">
      {!hideHeader && <CWText type="h2">Prediction Markets</CWText>}
      {!hideFilters && (
        <div className={clsx('filters', { hasAppliedFilter })}>
          <CWButton
            label="Filters"
            iconRight="funnelSimple"
            buttonType="secondary"
            onClick={() => setIsFilterDrawerOpen((open) => !open)}
          />
          {!hideSearchTag && searchText?.trim() && (
            <CWTag
              label={`Search: ${searchText?.trim()}`}
              type="filter"
              onCloseClick={onClearSearch}
            />
          )}
          {filters.statuses.map((status) => (
            <CWTag
              key={status}
              label={STATUS_LABELS[status]}
              type="filter"
              onCloseClick={() => removeStatusFilter(status)}
            />
          ))}
          {filters.community_id && (
            <CWTag
              label={`Community: ${filters.community_id}`}
              type="filter"
              onCloseClick={removeCommunityFilter}
            />
          )}
          {filters.sort !== 'recency' && (
            <CWTag
              label={
                SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ??
                filters.sort
              }
              type="filter"
              onCloseClick={removeSortFilter}
            />
          )}
        </div>
      )}
      {isInitialLoading ? (
        <div className="markets-loading">
          <CWCircleMultiplySpinner />
        </div>
      ) : markets.length === 0 ? (
        <div className="empty-placeholder">
          <CWText type="h2">No prediction markets found</CWText>
          <CWText type="b2" className="empty-description">
            Try adjusting your search or filters to find prediction markets.
          </CWText>
        </div>
      ) : isHorizontalScroll ? (
        <>
          {markets.map((market) => (
            <ExplorePredictionMarketCard
              key={market.id}
              market={
                market as Parameters<
                  typeof ExplorePredictionMarketCard
                >[0]['market']
              }
              showVolume={false}
            />
          ))}
        </>
      ) : (
        <>
          <div className="markets-grid">
            {markets.map((market) => (
              <ExplorePredictionMarketCard
                key={market.id}
                market={
                  market as Parameters<
                    typeof ExplorePredictionMarketCard
                  >[0]['market']
                }
                showVolume={showVolume}
              />
            ))}
          </div>
          {isFetchingNextPage && (
            <div className="markets-loading">
              <CWCircleMultiplySpinner />
            </div>
          )}
          {hasNextPage && !isFetchingNextPage && !hideSeeMore && (
            <div className="load-more-container">
              <CWButton
                label="Load more"
                buttonType="tertiary"
                containerClassName="ml-auto"
                onClick={handleFetchMore}
              />
            </div>
          )}
        </>
      )}
      <FiltersDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
};

export default PredictionMarketsList;
