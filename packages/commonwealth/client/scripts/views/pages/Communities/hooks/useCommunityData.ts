import { Community } from '@hicommonwealth/schemas';
import { ChainNetwork } from '@hicommonwealth/shared';
import { useCallback, useMemo } from 'react';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import useFetchTokenUsdRateQuery from 'state/api/communityStake/fetchTokenUsdRate'; // Updated import path
import { useFetchTagsQuery } from 'state/api/tags';
import { z } from 'zod';
import { trpc } from '../../../../utils/trpcClient';
import {
  CommunityFilters,
  CommunitySortOptions,
  communitySortOptionsLabelToKeysMap,
  sortOrderLabelsToDirectionsMap,
} from '../FiltersDrawer';

// Define the type for a single community item
type CommunityItem = z.infer<typeof Community>;

// Define the type for a pair of community items (or one item and undefined)
type CommunityPair = [CommunityItem, CommunityItem | undefined];

export function useCommunityData(
  filters: CommunityFilters,
  searchValue: string,
) {
  const { data: tags, isLoading: isLoadingTags } = useFetchTagsQuery();

  const {
    data: communities,
    fetchNextPage: fetchMoreCommunitiesOriginal,
    hasNextPage,
    isLoading: isInitialCommunitiesLoading, // Assuming isLoading is returned
  } = useFetchCommunitiesQuery({
    limit: 50,
    cursor: 1,
    include_node_info: true,
    // Reconstruct order_by logic
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
          ] as any) || 'lifetime_thread_count' // Default if mapping fails
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
      ? ChainNetwork[filters.withNetwork] // Assuming ChainNetwork enum access
      : undefined,
    stake_enabled: filters.withStakeEnabled,
    // cursor: 1, // Use default cursor handling of useFetchCommunitiesQuery
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

  // Use the correct tRPC hook now
  const { data: historicalPricesData, isLoading: isLoadingHistoricalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      // Provide input
      past_date_epoch: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // 24 hours ago
      // community_id: filters.communityId, // Optional: Add if filtering by specific community
      // stake_id: filters.stakeId, // Optional: Defaults to 2 if not provided
    });

  const { data: ethUsdRateData, isLoading: isLoadingEthUsdRate } =
    useFetchTokenUsdRateQuery({
      // tokenSymbol: 'ETH', // Incorrect prop
      // TODO: Replace with the correct WETH/ETH contract address for the target chain
      tokenContractAddress: '0x...', // Use tokenContractAddress instead
    });
  const ethUsdRate = ethUsdRateData?.data?.data?.amount; // Adjust path if needed based on the correct hook's response

  const isLoading =
    isLoadingTags ||
    isInitialCommunitiesLoading ||
    isLoadingHistoricalPrices ||
    isLoadingEthUsdRate;

  // Create the base communities list
  const communitiesList = useMemo(() => {
    const flatList = (communities?.pages || []).flatMap((page) => page.results);

    const SLICE_SIZE = 2;
    // TODO: Refine the type for twoCommunitiesPerEntry
    const twoCommunitiesPerEntry: CommunityPair[] = []; // Use the defined CommunityPair type

    for (let i = 0; i < flatList.length; i += SLICE_SIZE) {
      // Pushing slices of the inferred type from flatList
      twoCommunitiesPerEntry.push(
        flatList.slice(i, i + SLICE_SIZE) as CommunityPair,
      );
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
    // TODO: Refine the type for filteredSlices
    const filteredSlices: CommunityPair[] = []; // Use the defined CommunityPair type

    for (let i = 0; i < filteredList.length; i += SLICE_SIZE) {
      const slice = filteredList.slice(i, i + SLICE_SIZE);
      // Only add slices with valid items
      if (slice.length === SLICE_SIZE) {
        // Pushing slices of the inferred type from filteredList
        filteredSlices.push(slice as CommunityPair);
      } else if (slice.length === 1) {
        // For the last odd item, create a slice with undefined as the second item
        // But make sure the first item is valid
        if (slice[0] && slice[0].id) {
          // Pushing a tuple matching the inferred structure
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
    historicalPrices: historicalPricesData, // Use data from the correct hook
    ethUsdRate: Number(ethUsdRate),
    tags,
  };
}
