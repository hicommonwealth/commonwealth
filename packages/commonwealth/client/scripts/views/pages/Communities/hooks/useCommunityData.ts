import { Community, GetCommunities } from '@hicommonwealth/schemas';
import { ChainNetwork } from '@hicommonwealth/shared';
import { useCallback, useMemo } from 'react';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import useFetchTokenUsdRateQuery from 'state/api/communityStake/fetchTokenUsdRate';
import { useFetchTagsQuery } from 'state/api/tags';
import { z } from 'zod';
import { trpc } from '../../../../utils/trpcClient';
import {
  CommunityFilters,
  CommunitySortOptions,
  communitySortOptionsLabelToKeysMap,
  sortOrderLabelsToDirectionsMap,
} from '../FiltersDrawer';

// Define the type for valid order_by values based on the schema/query input
type CommunityOrderBy = z.infer<typeof GetCommunities.input>['order_by'];

// Define the type for a single community item (with Date types)
type CommunityItemWithDates = z.infer<typeof Community>;

// Define the type for a pair of community items (with Date types)
type CommunityPairWithDates = [
  CommunityItemWithDates,
  CommunityItemWithDates | undefined,
];

// Define the type for the raw API result (potential string dates)
// Extend GetCommunities.output to reflect the raw structure if necessary
// type RawCommunityPage = z.infer<typeof GetCommunities.output>; // Removed unused type

export function useCommunityData(
  filters: CommunityFilters,
  searchValue: string,
) {
  const { data: tags, isLoading: isLoadingTags } = useFetchTagsQuery();

  const {
    data: communities, // This holds the raw InfiniteData potentially with string dates
    fetchNextPage: fetchMoreCommunitiesOriginal,
    hasNextPage,
    isLoading: isInitialCommunitiesLoading,
  } = useFetchCommunitiesQuery({
    limit: 50,
    cursor: 1,
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
        // Ensure the mapped key is a valid CommunityOrderBy type
        const mappedKey = communitySortOptionsLabelToKeysMap[
          filters.withCommunitySortBy
        ] as CommunityOrderBy;
        return mappedKey || 'lifetime_thread_count';
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
    tag_ids:
      filters.withTagsIds && filters.withTagsIds.length > 0
        ? filters.withTagsIds
        : undefined,
    community_type: filters.withCommunityType,
  });

  // Memoize processed data with correct Date types
  const processedCommunitiesData = useMemo(() => {
    if (!communities) return undefined;
    return {
      ...communities,
      pages: communities.pages.map((page) => ({
        ...page,
        results: page.results.map((community) => ({
          ...community,
          created_at: community.created_at
            ? new Date(community.created_at)
            : undefined,
          updated_at: community.updated_at
            ? new Date(community.updated_at)
            : undefined,
          topics: community.topics?.map((topic) => ({
            ...topic,
            created_at: topic.created_at
              ? new Date(topic.created_at)
              : undefined,
            updated_at: topic.updated_at
              ? new Date(topic.updated_at)
              : undefined,
            archived_at: topic.archived_at
              ? new Date(topic.archived_at)
              : undefined,
          })),
        })) as CommunityItemWithDates[], // Assert results conform to the type with Dates
      })),
    };
  }, [communities]);

  // Wrap fetchMoreCommunities
  const fetchMoreCommunities = useCallback(async () => {
    await fetchMoreCommunitiesOriginal();
  }, [fetchMoreCommunitiesOriginal]);

  // Fetch historical prices and ETH rate (existing logic)
  const { data: historicalPricesData, isLoading: isLoadingHistoricalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: Math.floor(Date.now() / 1000) - 24 * 60 * 60,
    });
  const { data: ethUsdRateData, isLoading: isLoadingEthUsdRate } =
    useFetchTokenUsdRateQuery({
      tokenContractAddress: '0x...',
    });
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  const isLoading =
    isLoadingTags ||
    isInitialCommunitiesLoading ||
    isLoadingHistoricalPrices ||
    isLoadingEthUsdRate;

  // Create communitiesList using processed data
  const communitiesList = useMemo(() => {
    const flatList = (processedCommunitiesData?.pages || []).flatMap(
      (page) => page.results,
    );
    const SLICE_SIZE = 2;
    const twoCommunitiesPerEntry: CommunityPairWithDates[] = [];
    for (let i = 0; i < flatList.length; i += SLICE_SIZE) {
      const item1 = flatList[i];
      const item2 = flatList[i + 1]; // Can be undefined
      twoCommunitiesPerEntry.push([item1, item2]);
    }
    return twoCommunitiesPerEntry;
  }, [processedCommunitiesData]);

  // Filter communitiesList using processed data
  const filteredCommunitiesList = useMemo(() => {
    if (!searchValue) {
      return communitiesList;
    }
    const searchLower = searchValue.toLowerCase().trim();
    const flatList = (processedCommunitiesData?.pages || []).flatMap(
      (page) => page.results,
    );

    const filteredList = flatList.filter((community) => {
      return (
        community &&
        (community.name?.toLowerCase()?.includes(searchLower) ||
          community.description?.toLowerCase()?.includes(searchLower))
      );
    });

    const SLICE_SIZE = 2;
    const filteredSlices: CommunityPairWithDates[] = [];
    for (let i = 0; i < filteredList.length; i += SLICE_SIZE) {
      const item1 = filteredList[i];
      const item2 = filteredList[i + 1];
      if (item1?.id) {
        filteredSlices.push([item1, item2]);
      }
    }
    return filteredSlices;
  }, [communitiesList, processedCommunitiesData, searchValue]);

  return {
    communities: processedCommunitiesData, // Return the processed data
    communitiesList, // This now uses processed data
    filteredCommunitiesList, // This now uses processed data
    fetchMoreCommunities,
    hasNextPage,
    isLoading,
    isInitialCommunitiesLoading,
    historicalPrices: historicalPricesData,
    ethUsdRate: Number(ethUsdRate),
    tags,
  };
}
