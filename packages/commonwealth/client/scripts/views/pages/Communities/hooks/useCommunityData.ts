import { ChainNetwork } from '@hicommonwealth/shared';
import { useCallback, useMemo, useRef } from 'react';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import { useFetchTagsQuery } from 'state/api/tags';
import { useFetchTokenUsdRateQuery } from '../../../../state/api/communityStake/index';
import { trpc } from '../../../../utils/trpcClient';
import {
  CommunityFilters,
  CommunitySortOptions,
  communitySortOptionsLabelToKeysMap,
  sortOrderLabelsToDirectionsMap,
} from '../FiltersDrawer';

export function useCommunityData(
  filters: CommunityFilters,
  searchValue: string,
) {
  const oneDayAgo = useRef(new Date().getTime() - 24 * 60 * 60 * 1000);

  const { data: tags, isLoading: isLoadingTags } = useFetchTagsQuery();

  const {
    data: communities,
    fetchNextPage: fetchMoreCommunitiesOriginal,
    hasNextPage,
    isInitialLoading: isInitialCommunitiesLoading,
  } = useFetchCommunitiesQuery({
    limit: 50,
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
    cursor: 1,
    tag_ids:
      filters.withTagsIds && filters.withTagsIds.length > 0
        ? filters.withTagsIds
        : undefined,
    community_type: filters.withCommunityType,
  });

  // Wrap fetchMoreCommunities to return Promise<void>
  const fetchMoreCommunities = useCallback(async () => {
    await fetchMoreCommunitiesOriginal();
  }, [fetchMoreCommunitiesOriginal]);

  const { data: historicalPrices, isLoading: isLoadingHistoricalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: oneDayAgo.current / 1000, // 24 hours ago
    });

  const { data: ethUsdRateData, isLoading: isLoadingEthUsdRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  const isLoading =
    isLoadingTags ||
    isInitialCommunitiesLoading ||
    isLoadingHistoricalPrices ||
    isLoadingEthUsdRate;

  // Create the base communities list
  const communitiesList = useMemo(() => {
    const flatList = (communities?.pages || []).flatMap((page) => page.results);

    const SLICE_SIZE = 2;
    const twoCommunitiesPerEntry = [];

    for (let i = 0; i < flatList.length; i += SLICE_SIZE) {
      twoCommunitiesPerEntry.push(flatList.slice(i, i + SLICE_SIZE));
    }

    return twoCommunitiesPerEntry;
  }, [communities?.pages]);

  // Filter communities list based on search value
  const filteredCommunitiesList = useMemo(() => {
    if (!searchValue) {
      return communitiesList;
    }

    const searchLower = searchValue.toLowerCase().trim();
    const flatList = (communities?.pages || []).flatMap((page) => page.results);

    // Filter based on name or description
    const filteredList = flatList.filter((community) => {
      return (
        community &&
        (community.name?.toLowerCase()?.includes(searchLower) ||
          community.description?.toLowerCase()?.includes(searchLower))
      );
    });

    // Recreate the sliced structure
    const SLICE_SIZE = 2;
    const filteredSlices = [];

    for (let i = 0; i < filteredList.length; i += SLICE_SIZE) {
      const slice = filteredList.slice(i, i + SLICE_SIZE);
      // Only add slices with valid items
      if (slice.length === SLICE_SIZE) {
        filteredSlices.push(slice);
      } else if (slice.length === 1) {
        // For the last odd item, create a slice with undefined as the second item
        // But make sure the first item is valid
        if (slice[0] && slice[0].id) {
          filteredSlices.push([slice[0], undefined]);
        }
      }
    }

    return filteredSlices;
  }, [communitiesList, communities?.pages, searchValue]);

  return {
    communities,
    communitiesList,
    filteredCommunitiesList,
    fetchMoreCommunities,
    hasNextPage,
    isLoading,
    isInitialCommunitiesLoading,
    historicalPrices,
    ethUsdRate: Number(ethUsdRate),
    tags,
  };
}
