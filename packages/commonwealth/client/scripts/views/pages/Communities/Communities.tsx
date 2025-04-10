import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainNetwork } from '@hicommonwealth/shared';
import { findDenominationString } from 'helpers/findDenomination';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import { useFetchQuestsQuery } from 'state/api/quest';
import { useFetchTagsQuery } from 'state/api/tags';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { z } from 'zod';
import { useFetchTokenUsdRateQuery } from '../../../state/api/communityStake/index';
import { useFetchGlobalActivityQuery } from '../../../state/api/feeds/fetchUserActivity';
import { trpc } from '../../../utils/trpcClient';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import CWTab from '../../components/component_kit/new_designs/CWTabs/CWTab';
import CWTabsRow from '../../components/component_kit/new_designs/CWTabs/CWTabsRow';
import { Feed } from '../../components/feed';
import CreateCommunityButton from '../../components/sidebar/CreateCommunityButton';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import useCommunityContests from '../CommunityManagement/Contests/useCommunityContests';
import XPTable, { QuestOption } from '../Leaderboard/XPTable/XPTable';
import AllTabContent from './AllTabContent';
import './Communities.scss';
import CommunitiesTabContent from './CommunitiesTabContent';
import ExploreContestList from './ExploreContestList';
import { ContestStage as ExploreContestStage } from './ExploreContestList/ExploreContestList';
import {
  CommunityFilters,
  CommunitySortDirections,
  CommunitySortOptions,
  FiltersDrawer,
  communityChains,
  communitySortOptionsLabelToKeysMap,
  sortOrderLabelsToDirectionsMap,
} from './FiltersDrawer';
import IdeaLaunchpad from './IdeaLaunchpad';
import QuestList from './QuestList';
import SearchFilterRow, {
  FilterTag,
  InlineFilter,
  ViewType,
} from './SearchFilterRow';
import TokensList from './TokensList';
import {
  FilterOption,
  createSearchFilterTag,
  createSelectFilter,
  createToggleFilter,
} from './filters';
import { getCommunityCountsString } from './helpers';

type ExtendedCommunityType = z.infer<typeof ExtendedCommunity>;
type ExtendedCommunitySliceType = [
  ExtendedCommunityType,
  ExtendedCommunityType,
];

// Contest stage constants
const CONTEST_STAGE = {
  ALL: 'all',
  ACTIVE: 'active',
  PAST: 'past',
} as const;

type ContestStageType = (typeof CONTEST_STAGE)[keyof typeof CONTEST_STAGE];

// Quest stage constants
const QUEST_STAGE = {
  ALL: 'all',
  ACTIVE: 'active',
  PAST: 'past',
} as const;

type QuestStageType = (typeof QUEST_STAGE)[keyof typeof QUEST_STAGE];

const CommunitiesPage = () => {
  const containerRef = useRef();
  const launchpadEnabled = useFlag('launchpad');
  const questsEnabled = useFlag('xp');
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();

  // Define available tab views
  const TAB_VIEWS = [
    { value: 'all', label: 'All' },
    { value: 'communities', label: 'Communities' },
    { value: 'users', label: 'Users' },
    { value: 'contests', label: 'Contests' },
    { value: 'threads', label: 'Threads' },
    ...(questsEnabled ? [{ value: 'quests', label: 'Quests' }] : []),
    ...(launchpadEnabled ? [{ value: 'tokens', label: 'Tokens' }] : []),
  ];

  // Add state for tracking active tab
  const activeTab = searchParams.get('tab') || 'all';

  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  // Common states for all tabs
  const [searchValue, setSearchValue] = useState('');
  const [selectedViewType, setSelectedViewType] = useState(ViewType.Cards);

  // Users tab filter state
  const [selectedQuestFilter, setSelectedQuestFilter] =
    useState<QuestOption | null>(null);

  // Fetch quests for the Users tab inline filter
  const { data: questsList } = useFetchQuestsQuery({
    limit: 50,
    include_system_quests: true,
    cursor: 1,
    enabled: questsEnabled,
  });

  const questOptions = useMemo(() => {
    const quests = (questsList?.pages || []).flatMap((page) => page.results);
    return quests.map((quest) => ({
      value: quest.id.toString(),
      label: quest.name,
    }));
  }, [questsList]);

  // State for Communities tab
  const [filters, setFilters] = useState<CommunityFilters>({
    withCommunityEcosystem: undefined,
    withStakeEnabled: undefined,
    withTagsIds: [],
    withCommunitySortBy: CommunitySortOptions.MemberCount,
    withCommunitySortOrder: CommunitySortDirections.Descending,
    withCommunityType: undefined,
    withEcosystemChainId: undefined,
    withNetwork: undefined,
  });

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [selectedCommunityId, setSelectedCommunityId] = useState<string>();

  const oneDayAgo = useRef(new Date().getTime() - 24 * 60 * 60 * 1000);

  const { data: tags, isLoading: isLoadingTags } = useFetchTagsQuery();

  const { isWindowSmallInclusive } = useBrowserWindow({});

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
    const twoCommunitiesPerEntry: ExtendedCommunitySliceType[] = [];

    for (let i = 0; i < flatList.length; i += SLICE_SIZE) {
      twoCommunitiesPerEntry.push(
        flatList.slice(i, i + SLICE_SIZE) as ExtendedCommunitySliceType,
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
    const filteredSlices: ExtendedCommunitySliceType[] = [];

    for (let i = 0; i < filteredList.length; i += SLICE_SIZE) {
      const slice = filteredList.slice(i, i + SLICE_SIZE);
      // Only add slices with valid items
      if (slice.length === SLICE_SIZE) {
        filteredSlices.push(slice as ExtendedCommunitySliceType);
      } else if (slice.length === 1) {
        // For the last odd item, create a slice with undefined as the second item
        // But make sure the first item is valid
        if (slice[0] && slice[0].id) {
          filteredSlices.push([
            slice[0],
            undefined as any,
          ] as ExtendedCommunitySliceType);
        }
      }
    }

    return filteredSlices;
  }, [communitiesList, communities?.pages, searchValue]);

  const removeStakeFilter = () => {
    setFilters({
      ...filters,
      withStakeEnabled: false,
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

  const communitiesCount = (
    <CWText type="b2" className="communities-count">
      {!isLoading && communities?.pages?.[0]?.totalResults
        ? getCommunityCountsString(communities?.pages?.[0]?.totalResults)
        : 'No communities found'}
    </CWText>
  );

  // Function to handle tab switching
  const handleTabClick = (tabValue: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabValue);
    navigate(`/explore?${params.toString()}`);

    // Reset search input and filters when changing tabs
    setSearchValue('');
    setSelectedQuestFilter(null);
  };

  // Get filter tags for current communities tab
  const getCommunitiesFilterTags = (): FilterTag[] => {
    const filterTags: FilterTag[] = [];

    if (searchValue) {
      filterTags.push({
        label: `Search: ${searchValue}`,
        onRemove: () => setSearchValue(''),
      });
    }

    if (filters.withCommunitySortBy) {
      filterTags.push({
        label: `${filters.withCommunitySortBy}${
          filters.withCommunitySortOrder &&
          filters.withCommunitySortBy !== CommunitySortOptions.MostRecent
            ? ` : ${filters.withCommunitySortOrder}`
            : ''
        }`,
        onRemove: removeCommunitySortByFilter,
      });
    }

    if (filters.withCommunityType) {
      filterTags.push({
        label: String(filters.withCommunityType),
        onRemove: removeCommunityTypeFilter,
      });
    }

    if (filters.withNetwork) {
      filterTags.push({
        label: String(filters.withNetwork),
        onRemove: removeChainNetworkFilter,
      });
    }

    if (filters.withCommunityEcosystem) {
      filterTags.push({
        label: String(filters.withCommunityEcosystem),
        onRemove: removeCommunityEcosystemFilter,
      });
    }

    if (filters.withEcosystemChainId) {
      const chainName = Object.entries(communityChains).find(
        ([_, v]) => filters.withEcosystemChainId === v,
      )?.[0];

      if (chainName) {
        filterTags.push({
          label: chainName,
          onRemove: removeEcosystemChainIdFilter,
        });
      }
    }

    if (filters.withStakeEnabled) {
      filterTags.push({
        label: 'Stake',
        onRemove: removeStakeFilter,
      });
    }

    if (filters.withTagsIds) {
      filters.withTagsIds.forEach((id) => {
        const tagName = (tags || []).find((t) => t.id === id)?.name;
        if (tagName) {
          filterTags.push({
            label: tagName,
            onRemove: () => removeTagFilter(id),
          });
        }
      });
    }

    return filterTags;
  };

  // Sample filter tags for other tabs (for demonstration)
  const getThreadsFilterTags = (): FilterTag[] => {
    return searchValue
      ? [
          {
            label: `Search: ${searchValue}`,
            onRemove: () => setSearchValue(''),
          },
        ]
      : [];
  };

  const getUsersFilterTags = (): FilterTag[] => {
    const tags = [];

    const searchTag = createSearchFilterTag(searchValue, setSearchValue);
    if (searchTag) {
      tags.push(searchTag);
    }

    return tags;
  };

  // Quest tab filter state
  const [selectedQuestStage, setSelectedQuestStage] = useState<QuestStageType>(
    QUEST_STAGE.ALL,
  );
  const [questFilterTags, setQuestFilterTags] = useState<FilterTag[]>([]);

  // Contest tab filter state
  const [selectedContestStage, setSelectedContestStage] =
    useState<ContestStageType>(CONTEST_STAGE.ALL);
  const [selectedContestCommunityId, setSelectedContestCommunityId] =
    useState<string>('');
  const [contestFilterTags, setContestFilterTags] = useState<FilterTag[]>([]);

  // Pre-fetch contest data and community options for the contest tab to avoid hook rendering issues
  const {
    contestsData: { active: activeContests, finished: pastContests },
  } = useCommunityContests({
    fetchAll: true,
  });

  // Collect all unique community IDs from contests
  const contestCommunityIds = useMemo(
    () => [
      ...new Set([
        ...activeContests.map((contest) => contest.community_id),
        ...pastContests.map((contest) => contest.community_id),
      ]),
    ],
    [activeContests, pastContests],
  );

  // Fetch community data for dropdown options
  const communityQueries = trpc.useQueries((t) =>
    contestCommunityIds.map((id) =>
      t.community.getCommunity({ id: id!, include_node_info: true }),
    ),
  );

  // Create options for community dropdown
  const contestCommunityOptions = useMemo(() => {
    return [
      { value: '', label: 'All' },
      ...contestCommunityIds.map((id, index) => {
        const communityData = communityQueries[index].data;
        // Truncate community names to prevent overflow
        const communityName = communityData?.name || 'Unknown Community';
        const shortenedName =
          communityName.length > 20
            ? `${communityName.substring(0, 18)}...`
            : communityName;

        return {
          value: id || '',
          label: shortenedName,
          fullLabel: communityName, // Keep full name for filter tags
        };
      }),
    ];
  }, [contestCommunityIds, communityQueries]);

  // Add state for Threads tab filters
  const [threadsFilterCommunityId, setThreadsFilterCommunityId] =
    useState<string>('');
  const [threadsSortOption, setThreadsSortOption] = useState<string>('newest');
  const [threadsFilterTags, setThreadsFilterTags] = useState<FilterTag[]>([]);
  const [threadFilterKey, setThreadFilterKey] = useState(0);

  // Add state for Tokens tab filters
  const [tokensFilterTag, setTokensFilterTag] = useState<string>('');
  const [tokensSortOption, setTokensSortOption] =
    useState<string>('mostRecent');
  const [tokensFilterTags, setTokensFilterTags] = useState<FilterTag[]>([]);

  // Get the appropriate filter tags based on the active tab
  const getFilterTagsByActiveTab = (): FilterTag[] => {
    // Add search filter tag if there's a search value
    // We no longer need this line since createSearchFilterTag handles empty values safely

    switch (activeTab) {
      case 'communities':
        return getCommunitiesFilterTags();
      case 'threads': {
        // Handle each case separately with proper typing
        const tags = [...threadsFilterTags];
        if (searchValue) {
          tags.push(createSearchFilterTag(searchValue, setSearchValue));
        }
        return tags;
      }
      case 'users': {
        if (searchValue) {
          return [createSearchFilterTag(searchValue, setSearchValue)];
        }
        return [];
      }
      case 'contests': {
        const tags = [...contestFilterTags];
        if (searchValue) {
          tags.push(createSearchFilterTag(searchValue, setSearchValue));
        }
        return tags;
      }
      case 'quests': {
        const tags = [...questFilterTags];
        if (searchValue) {
          tags.push(createSearchFilterTag(searchValue, setSearchValue));
        }
        return tags;
      }
      case 'tokens': {
        const tags = [...tokensFilterTags];
        if (searchValue) {
          tags.push(createSearchFilterTag(searchValue, setSearchValue));
        }
        return tags;
      }
      default:
        return [];
    }
  };

  // Get the appropriate filter click handler based on active tab
  const getFilterClickHandler = () => {
    switch (activeTab) {
      case 'communities':
        return () => setIsFilterDrawerOpen(true);
      // Don't show filter icon for contests since we use inline filters
      case 'contests':
        return undefined;
      // For users tab we're now using inline filters
      default:
        return undefined;
    }
  };

  // Get inline filters configuration based on the active tab
  const getInlineFiltersByActiveTab = (): InlineFilter[] => {
    if (activeTab === 'users' && questsEnabled) {
      return [
        {
          type: 'select',
          label: 'Filter by:',
          placeholder: 'Select Quest',
          value: selectedQuestFilter,
          onChange: (option) => setSelectedQuestFilter(option),
          options: questOptions,
          isClearable: true,
          isSearchable: true,
        },
      ];
    }

    if (activeTab === 'quests' && questsEnabled) {
      return [
        createToggleFilter({
          label: 'Filter by:',
          placeholder: 'Select Quest Stage',
          options: [
            { value: QUEST_STAGE.ALL, label: 'All' },
            { value: QUEST_STAGE.ACTIVE, label: 'Active' },
            { value: QUEST_STAGE.PAST, label: 'Past' },
          ],
          state: {
            selectedValue: selectedQuestStage,
            setSelectedValue: setSelectedQuestStage,
            filterTags: questFilterTags,
            setFilterTags: setQuestFilterTags,
          },
          getLabel: (value) =>
            value === QUEST_STAGE.ALL
              ? 'All'
              : value === QUEST_STAGE.ACTIVE
                ? 'Active'
                : 'Past',
          getRemoveTagsFilter: (tags) =>
            tags.filter(
              (tag) =>
                !tag.label.startsWith('All') &&
                !tag.label.startsWith('Active') &&
                !tag.label.startsWith('Past'),
            ),
          defaultValue: QUEST_STAGE.ALL,
          tagPrefix: 'Quests',
        }),
      ];
    }

    if (activeTab === 'contests') {
      return [
        createToggleFilter({
          label: 'Filter by:',
          placeholder: 'Select Contest Stage',
          options: [
            { value: CONTEST_STAGE.ALL, label: 'All' },
            { value: CONTEST_STAGE.ACTIVE, label: 'Active' },
            { value: CONTEST_STAGE.PAST, label: 'Past' },
          ],
          state: {
            selectedValue: selectedContestStage,
            setSelectedValue: setSelectedContestStage,
            filterTags: contestFilterTags,
            setFilterTags: setContestFilterTags,
          },
          getLabel: (value) =>
            value === CONTEST_STAGE.ALL
              ? 'All'
              : value === CONTEST_STAGE.ACTIVE
                ? 'Active'
                : 'Past',
          getRemoveTagsFilter: (tags) =>
            tags.filter(
              (tag) =>
                !tag.label.startsWith('All') &&
                !tag.label.startsWith('Active') &&
                !tag.label.startsWith('Past'),
            ),
          defaultValue: CONTEST_STAGE.ALL,
          tagPrefix: 'Contests',
        }),
        createSelectFilter({
          label: 'Community:',
          placeholder: 'Select Community',
          className: 'community-filter',
          options: contestCommunityOptions,
          state: {
            selectedValue: selectedContestCommunityId,
            setSelectedValue: setSelectedContestCommunityId,
            filterTags: contestFilterTags,
            setFilterTags: setContestFilterTags,
          },
          getTagLabel: (option) => option.fullLabel || option.label,
          tagPrefix: 'Community',
        }),
      ];
    }

    if (activeTab === 'threads') {
      // Create community options for threads filter
      const threadsCommunityOptions: FilterOption[] = [
        { value: '', label: 'All' },
        ...(communities?.pages || [])
          .flatMap((page) => page.results)
          .map((community) => ({
            value: community.id || '',
            label: community.name || 'Unknown Community',
            fullLabel: community.name || 'Unknown Community',
          })),
      ];

      return [
        createSelectFilter({
          label: 'Community:',
          placeholder: 'Select Community',
          className: 'community-filter',
          options: threadsCommunityOptions,
          state: {
            selectedValue: threadsFilterCommunityId,
            setSelectedValue: setThreadsFilterCommunityId,
            filterTags: threadsFilterTags,
            setFilterTags: setThreadsFilterTags,
            forceRefreshKey: threadFilterKey,
            setForceRefreshKey: setThreadFilterKey,
          },
          tagPrefix: 'Community',
        }),
        createSelectFilter({
          label: 'Sort by:',
          placeholder: 'Sort Threads',
          options: [
            { value: 'newest', label: 'Newest' },
            { value: 'upvotes', label: 'Most Upvotes' },
          ],
          state: {
            selectedValue: threadsSortOption,
            setSelectedValue: setThreadsSortOption,
            filterTags: threadsFilterTags,
            setFilterTags: setThreadsFilterTags,
            forceRefreshKey: threadFilterKey,
            setForceRefreshKey: setThreadFilterKey,
          },
          getTagLabel: (option) => option.label,
          tagPrefix: 'Sort',
        }),
      ];
    }

    if (activeTab === 'tokens' && launchpadEnabled) {
      // Create token sort options
      const tokenSortOptions = [
        { value: 'mostRecent', label: 'Most Recent' },
        { value: 'marketCap', label: 'Market Cap' },
        { value: 'oldest', label: 'Oldest' },
        { value: 'gain24h', label: '24h Gain' },
        { value: 'lastActivity', label: 'Latest Activity' },
      ];

      // Create tag options for tokens filter
      const tokenTagOptions = [
        { value: '', label: 'All Tags' },
        ...(tags || []).map((tag) => ({
          value: String(tag.id),
          label: tag.name,
        })),
      ];

      return [
        createSelectFilter({
          label: 'Filter by:',
          placeholder: 'Select Tag',
          className: 'tag-filter',
          options: tokenTagOptions,
          state: {
            selectedValue: tokensFilterTag,
            setSelectedValue: setTokensFilterTag,
            filterTags: tokensFilterTags,
            setFilterTags: setTokensFilterTags,
          },
          tagPrefix: 'Tag',
        }),
        createSelectFilter({
          label: 'Sort by:',
          placeholder: 'Sort Tokens',
          options: tokenSortOptions,
          state: {
            selectedValue: tokensSortOption,
            setSelectedValue: setTokensSortOption,
            filterTags: tokensFilterTags,
            setFilterTags: setTokensFilterTags,
          },
          getTagLabel: (option) => option.label,
          tagPrefix: 'Sort',
        }),
      ];
    }

    return [];
  };

  // Implement function to determine which tabs should show view toggle
  const shouldShowViewToggle = useCallback((tabName: string) => {
    return ['all'].includes(tabName);
  }, []);

  return (
    // @ts-expect-error <StrictNullChecks/>
    <CWPageLayout ref={containerRef} className="CommunitiesPageLayout">
      <div className="CommunitiesPage">
        <div className="header-section">
          <div className="description">
            <CWText
              type="h1"
              {...(launchpadEnabled && { fontWeight: 'semiBold' })}
            >
              Explore
            </CWText>

            {isWindowSmallInclusive ? communitiesCount : <></>}
            <div className="actions">
              {!isWindowSmallInclusive ? communitiesCount : <></>}
              {!launchpadEnabled && (
                <CreateCommunityButton buttonHeight="med" withIcon />
              )}
            </div>
          </div>

          <IdeaLaunchpad />

          {/* Tab Navigation */}
          <CWTabsRow className="explore-tabs-row">
            {TAB_VIEWS.map((tab) => (
              <CWTab
                key={tab.value}
                label={tab.label}
                isSelected={activeTab === tab.value}
                onClick={() => handleTabClick(tab.value)}
              />
            ))}
          </CWTabsRow>

          {/* Search and filter row for all tabs except 'all' */}
          {activeTab !== 'all' && (
            <SearchFilterRow
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              selectedViewType={selectedViewType}
              onViewTypeChange={setSelectedViewType}
              onFilterClick={getFilterClickHandler()}
              filterTags={getFilterTagsByActiveTab()}
              placeholder={`Search ${activeTab}`}
              showViewToggle={shouldShowViewToggle(activeTab)}
              inlineFilters={getInlineFiltersByActiveTab()}
            />
          )}
        </div>

        {/* Conditionally render content based on active tab */}
        {launchpadEnabled
          ? activeTab === 'tokens' && (
              <TokensList
                filters={{
                  ...filters,
                  withTagsIds: tokensFilterTag
                    ? [parseInt(tokensFilterTag, 10)]
                    : [],
                  sortBy: tokensSortOption,
                }}
                hideHeader
              />
            )
          : null}
        {questsEnabled
          ? activeTab === 'quests' && (
              <QuestList hideHeader stage={selectedQuestStage} />
            )
          : null}
        {activeTab === 'contests' && (
          <ExploreContestList
            hideHeader
            contestStage={
              selectedContestStage === CONTEST_STAGE.ALL
                ? undefined
                : selectedContestStage === CONTEST_STAGE.ACTIVE
                  ? ExploreContestStage.Active
                  : ExploreContestStage.Past
            }
            selectedCommunityId={selectedContestCommunityId}
          />
        )}
        {activeTab === 'threads' && (
          <div className="threads-tab">
            <Feed
              key={`threads-feed-${threadFilterKey}`}
              query={useFetchGlobalActivityQuery}
              customScrollParent={containerRef.current}
              queryOptions={{
                community_id: threadsFilterCommunityId || undefined,
                sort_by: threadsSortOption,
              }}
            />
          </div>
        )}
        {activeTab === 'users' && (
          <div className="users-tab">
            <div
              className={`users-xp-table ${selectedViewType === ViewType.Cards ? 'cards-view' : 'list-view'}`}
            >
              <XPTable
                hideHeader={true}
                selectedQuest={selectedQuestFilter}
                onQuestChange={setSelectedQuestFilter}
                searchTerm={searchValue}
              />
            </div>
          </div>
        )}

        {/* All tab - show all content types */}
        {activeTab === 'all' && (
          <>
            {/* Communities section */}
            <div className="section-container">
              <AllTabContent containerRef={containerRef} filters={filters} />
            </div>
          </>
        )}

        {/* Communities Tab Content */}
        {activeTab === 'communities' && (
          <>
            <FiltersDrawer
              isOpen={isFilterDrawerOpen}
              onClose={() => setIsFilterDrawerOpen(false)}
              filters={filters}
              onFiltersChange={(newFilters) => setFilters(newFilters)}
            />
            <CommunitiesTabContent
              isLoading={isLoading}
              isInitialCommunitiesLoading={isInitialCommunitiesLoading}
              communitiesList={
                searchValue ? filteredCommunitiesList : communitiesList
              }
              containerRef={containerRef}
              filters={filters}
              historicalPrices={historicalPrices}
              ethUsdRate={Number(ethUsdRate)}
              setSelectedCommunityId={setSelectedCommunityId}
              hasNextPage={hasNextPage}
              fetchMoreCommunities={fetchMoreCommunities}
            />
          </>
        )}

        <CWModal
          size="small"
          content={
            <ManageCommunityStakeModal
              mode={modeOfManageCommunityStakeModal}
              // @ts-expect-error <StrictNullChecks/>
              onModalClose={() => setModeOfManageCommunityStakeModal(null)}
              denomination={
                findDenominationString(selectedCommunityId || '') || 'ETH'
              }
            />
          }
          // @ts-expect-error <StrictNullChecks/>
          onClose={() => setModeOfManageCommunityStakeModal(null)}
          open={!!modeOfManageCommunityStakeModal}
        />
      </div>
    </CWPageLayout>
  );
};

export default CommunitiesPage;
