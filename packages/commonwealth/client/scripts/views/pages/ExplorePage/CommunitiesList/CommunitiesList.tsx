import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainNetwork, CommunityType } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import React, {
  Fragment,
  MutableRefObject,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import { useFetchTagsQuery } from 'state/api/tags';
import useUserStore from 'state/ui/user';
import { NewCommunityCard } from 'views/components/CommunityCard';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWRelatedCommunityCard } from 'views/components/component_kit/new_designs/CWRelatedCommunityCard';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { z } from 'zod';
import '../ExplorePage.scss';
import { getCommunityCountsString } from '../helpers';
import './CommunitiesList.scss';
import {
  CommunityFilters,
  CommunitySortDirections,
  CommunitySortOptions,
  FiltersDrawer,
  communityChains,
  communitySortOptionsLabelToKeysMap,
  sortOrderLabelsToDirectionsMap,
} from './FiltersDrawer';

type ExtendedCommunityType = z.infer<typeof ExtendedCommunity>;
type ExtendedCommunitySliceType = [
  ExtendedCommunityType,
  ExtendedCommunityType,
];

interface CommunitiesListProps {
  isLoading: boolean;
  containerRef: MutableRefObject<HTMLElement | undefined>;
  historicalPrices:
    | { community_id: string; old_price?: string | null }[]
    | undefined;
  ethUsdRate: number;
  setSelectedCommunityId: (id: string) => void;
  searchText?: string;
  onClearSearch?: () => void;
}

const CommunitiesList: React.FC<CommunitiesListProps> = ({
  isLoading,
  containerRef,
  historicalPrices,
  ethUsdRate,
  setSelectedCommunityId,
  searchText,
  onClearSearch,
}) => {
  const launchpadEnabled = useFlag('launchpad');
  const user = useUserStore();

  const { data: tags, isLoading: isLoadingTags } = useFetchTagsQuery({
    enabled: true,
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<CommunityFilters>({
    withCommunityEcosystem: undefined,
    withStakeEnabled: undefined,
    withLaunchpadToken: undefined,
    withPinnedToken: undefined,
    withTagsIds: undefined,
    withCommunitySortBy: CommunitySortOptions.MemberCount,
    withCommunitySortOrder: CommunitySortDirections.Descending,
    withCommunityType: undefined,
    withEcosystemChainId: undefined,
    withNetwork: undefined,
  });

  // TODO: 11814 - add param to api to search communities
  const {
    data: communities,
    fetchNextPage: fetchMoreCommunitiesOriginal,
    hasNextPage,
    isInitialLoading: isInitialCommunitiesLoading,
  } = useFetchCommunitiesQuery({
    limit: 50,
    search: searchText?.trim(),
    include_node_info: true,
    order_by: (() => {
      if (
        filters.withCommunitySortBy &&
        [
          CommunitySortOptions.MemberCount,
          CommunitySortOptions.ThreadCount,
          CommunitySortOptions.MostRecent,
        ].includes(filters.withCommunitySortBy)
      ) {
        return (
          (communitySortOptionsLabelToKeysMap[
            filters.withCommunitySortBy
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any) || 'lifetime_thread_count'
        );
      }

      return 'lifetime_thread_count';
    })(),
    order_direction:
      sortOrderLabelsToDirectionsMap[filters.withCommunitySortOrder || ''] ||
      'DESC',
    eth_chain_id:
      typeof filters.withEcosystemChainId === 'number'
        ? filters.withEcosystemChainId
        : undefined,
    cosmos_chain_id:
      typeof filters.withEcosystemChainId === 'string'
        ? filters.withEcosystemChainId
        : undefined,
    base: filters.withCommunityEcosystem || undefined,
    network: filters.withNetwork
      ? ChainNetwork[filters.withNetwork]
      : undefined,
    stake_enabled: filters.withStakeEnabled,
    has_launchpad_token: filters.withLaunchpadToken,
    has_pinned_token: filters.withPinnedToken,
    cursor: 1,
    tag_ids: filters.withTagsIds,
    community_type: filters.withCommunityType
      ? CommunityType[filters.withCommunityType]
      : undefined,
  });

  // Wrap fetchMoreCommunities to return Promise<void>
  const fetchMoreCommunities = useCallback(async () => {
    await fetchMoreCommunitiesOriginal();
  }, [fetchMoreCommunitiesOriginal]);

  const communitiesList = useMemo(() => {
    const flatList = (communities?.pages || []).flatMap((page) => page.results);

    const SLICE_SIZE = 2;
    const twoCommunitiesPerEntry: ExtendedCommunitySliceType[] = [];

    for (let i = 0; i < flatList.length; i += SLICE_SIZE) {
      twoCommunitiesPerEntry.push(
        flatList.slice(i, i + SLICE_SIZE) as ExtendedCommunitySliceType,
      );
    }

    return twoCommunitiesPerEntry;
  }, [communities?.pages]);

  const removeStakeFilter = () => {
    setFilters({
      ...filters,
      withStakeEnabled: false,
    });
  };

  const removeLaunchpadTokenFilter = () => {
    setFilters({
      ...filters,
      withLaunchpadToken: false,
    });
  };

  const removePinnedTokenFilter = () => {
    setFilters({
      ...filters,
      withPinnedToken: false,
    });
  };

  const removeTagFilter = (tagId: number) => {
    setFilters({
      ...filters,
      withTagsIds: [...(filters.withTagsIds || [])].filter(
        (id) => tagId !== id,
      ),
    });
  };

  const removeCommunityEcosystemFilter = () => {
    setFilters({
      ...filters,
      withCommunityEcosystem: undefined,
    });
  };

  const removeEcosystemChainIdFilter = () => {
    setFilters({
      ...filters,
      withEcosystemChainId: undefined,
    });
  };

  const removeChainNetworkFilter = () => {
    setFilters({
      ...filters,
      withNetwork: undefined,
    });
  };

  const removeCommunityTypeFilter = () => {
    setFilters({
      ...filters,
      withCommunityType: undefined,
    });
  };

  const removeCommunitySortByFilter = () => {
    setFilters({
      ...filters,
      withCommunitySortBy: undefined,
      withCommunitySortOrder: undefined,
    });
  };

  const isLoadingCommunities =
    isInitialCommunitiesLoading || isLoading || isLoadingTags;

  return (
    <>
      <div className="community-filters">
        <CWButton
          label="Filters"
          iconRight="funnelSimple"
          buttonType="secondary"
          onClick={() => setIsFilterDrawerOpen((isOpen) => !isOpen)}
        />
        {searchText?.trim() && (
          <CWTag
            label={`Search: ${searchText?.trim()}`}
            type="filter"
            onCloseClick={onClearSearch}
          />
        )}
        {filters.withCommunitySortBy && (
          <CWTag
            label={`${filters.withCommunitySortBy}${
              filters.withCommunitySortOrder &&
              filters.withCommunitySortBy !== CommunitySortOptions.MostRecent
                ? ` : ${filters.withCommunitySortOrder}`
                : ''
            }
                  `}
            type="filter"
            onCloseClick={removeCommunitySortByFilter}
          />
        )}
        {filters.withCommunityType && (
          <CWTag
            label={filters.withCommunityType}
            type="filter"
            onCloseClick={removeCommunityTypeFilter}
          />
        )}
        {filters.withNetwork && (
          <CWTag
            label={filters.withNetwork}
            type="filter"
            onCloseClick={removeChainNetworkFilter}
          />
        )}
        {filters.withCommunityEcosystem && (
          <CWTag
            label={filters.withCommunityEcosystem}
            type="filter"
            onCloseClick={removeCommunityEcosystemFilter}
          />
        )}
        {filters.withEcosystemChainId && (
          <CWTag
            label={
              Object.entries(communityChains).find(
                ([_, v]) => filters.withEcosystemChainId === v,
              )?.[0] as string
            }
            type="filter"
            onCloseClick={removeEcosystemChainIdFilter}
          />
        )}
        {filters.withStakeEnabled && (
          <CWTag
            label="With: Stake"
            type="filter"
            onCloseClick={removeStakeFilter}
          />
        )}
        {filters.withLaunchpadToken && (
          <CWTag
            label="With: Launchpad Token"
            type="filter"
            onCloseClick={removeLaunchpadTokenFilter}
          />
        )}
        {filters.withPinnedToken && (
          <CWTag
            label="With: External Token"
            type="filter"
            onCloseClick={removePinnedTokenFilter}
          />
        )}
        {filters.withTagsIds &&
          filters.withTagsIds.map((id) => (
            <CWTag
              key={id}
              type="filter"
              label={(tags || []).find((t) => t.id === id)?.name || ''}
              onCloseClick={() => removeTagFilter(id)}
            />
          ))}
        <FiltersDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          filters={filters}
          onFiltersChange={(newFilters) => setFilters(newFilters)}
        />
      </div>
      <CWText type="b2" className="communities-count">
        {!isLoading && communities?.pages?.[0]?.totalResults
          ? `Found ${getCommunityCountsString(communities?.pages?.[0]?.totalResults)}`
          : 'No communities found'}
      </CWText>
      {isLoadingCommunities && communitiesList.length === 0 ? (
        <CWCircleMultiplySpinner />
      ) : (
        <Virtuoso
          key={Object.values(filters)
            .map((v) => `${v}`)
            .join('-')}
          className="communities-list"
          style={{ height: '100%', width: '100%' }}
          data={isInitialCommunitiesLoading ? [] : communitiesList}
          customScrollParent={containerRef.current}
          itemContent={(listIndex, slicedCommunities) => {
            return slicedCommunities.map((community, sliceIndex) => {
              const canBuyStake = !!user.addresses.find?.(
                (address) => address?.community?.base === community?.base,
              );

              const historicalPriceMap: Map<string, string | undefined> =
                new Map(
                  Object.entries(
                    (historicalPrices || [])?.reduce(
                      (
                        acc: Record<string, string | undefined>,
                        { community_id, old_price },
                      ) => {
                        acc[community_id] = old_price || undefined;
                        return acc;
                      },
                      {},
                    ),
                  ),
                );

              return (
                <Fragment key={community.id}>
                  <CWRelatedCommunityCard
                    community={community}
                    memberCount={community.profile_count || 0}
                    threadCount={community.lifetime_thread_count || 0}
                    canBuyStake={canBuyStake}
                    onStakeBtnClick={() =>
                      setSelectedCommunityId(community?.id || '')
                    }
                    ethUsdRate={ethUsdRate.toString()}
                    {...(historicalPriceMap &&
                      community.id && {
                        historicalPrice: historicalPriceMap?.get(community.id),
                      })}
                    onlyShowIfStakeEnabled={!!filters.withStakeEnabled}
                  />
                  {listIndex === communitiesList.length - 1 &&
                    sliceIndex === slicedCommunities.length - 1 && (
                      <NewCommunityCard />
                    )}
                </Fragment>
              );
            });
          }}
          endReached={() => {
            hasNextPage && fetchMoreCommunities?.().catch(console.error);
          }}
          overscan={50}
          components={{
            // eslint-disable-next-line react/no-multi-comp
            EmptyPlaceholder: () => (
              <section
                className={clsx('empty-placeholder', {
                  'my-16': launchpadEnabled,
                })}
              >
                <CWText type="h2">
                  No communities found
                  {filters.withCommunityEcosystem ||
                  filters.withNetwork ||
                  filters.withStakeEnabled ||
                  filters.withTagsIds ||
                  filters.withCommunityType ||
                  filters.withEcosystemChainId
                    ? ` for the applied filters.`
                    : '.'}
                  <br />
                  Create a new community <Link to="/createCommunity">here</Link>
                  .
                </CWText>
              </section>
            ),
          }}
        />
      )}
    </>
  );
};

export default CommunitiesList;
