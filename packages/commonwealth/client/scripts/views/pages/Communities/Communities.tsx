import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainNetwork, CommunityType } from '@hicommonwealth/shared';
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
import XPTable, { QuestOption } from '../Leaderboard/XPTable/XPTable';
import AllTabContent from './AllTabContent';
import './Communities.scss';
import CommunitiesTabContent from './CommunitiesTabContent';
import ExploreContestList from './ExploreContestList';
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
import { getCommunityCountsString } from './helpers';

type ExtendedCommunityType = z.infer<typeof ExtendedCommunity>;
type ExtendedCommunitySliceType = [
  ExtendedCommunityType,
  ExtendedCommunityType,
];

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
    withTagsIds: undefined,
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
    tag_ids: filters.withTagsIds,
    community_type: filters.withCommunityType
      ? CommunityType[filters.withCommunityType]
      : undefined,
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
    const filterTags: FilterTag[] = [];

    if (searchValue) {
      filterTags.push({
        label: `Search: ${searchValue}`,
        onRemove: () => setSearchValue(''),
      });
    }

    // Don't add quest filter tags here since we're using inline filters now

    return filterTags;
  };

  const getContestsFilterTags = (): FilterTag[] => {
    return searchValue
      ? [
          {
            label: `Search: ${searchValue}`,
            onRemove: () => setSearchValue(''),
          },
        ]
      : [];
  };

  const getQuestsFilterTags = (): FilterTag[] => {
    return searchValue
      ? [
          {
            label: `Search: ${searchValue}`,
            onRemove: () => setSearchValue(''),
          },
        ]
      : [];
  };

  const getTokensFilterTags = (): FilterTag[] => {
    return searchValue
      ? [
          {
            label: `Search: ${searchValue}`,
            onRemove: () => setSearchValue(''),
          },
        ]
      : [];
  };

  // Get the appropriate filter tags based on the active tab
  const getFilterTagsByActiveTab = (): FilterTag[] => {
    switch (activeTab) {
      case 'communities':
        return getCommunitiesFilterTags();
      case 'threads':
        return getThreadsFilterTags();
      case 'users':
        return getUsersFilterTags();
      case 'contests':
        return getContestsFilterTags();
      case 'quests':
        return getQuestsFilterTags();
      case 'tokens':
        return getTokensFilterTags();
      default:
        return [];
    }
  };

  // Get the appropriate filter click handler based on active tab
  const getFilterClickHandler = () => {
    switch (activeTab) {
      case 'communities':
        return () => setIsFilterDrawerOpen(true);
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
          placeholder: 'Filter by Quest',
          value: selectedQuestFilter,
          onChange: (option) => setSelectedQuestFilter(option),
          options: questOptions,
          isClearable: true,
          isSearchable: true,
        },
      ];
    }
    return [];
  };

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
              showViewToggle={['communities', 'contests', 'tokens'].includes(
                activeTab,
              )}
              inlineFilters={getInlineFiltersByActiveTab()}
            />
          )}
        </div>

        {/* Conditionally render content based on active tab */}
        {launchpadEnabled
          ? activeTab === 'tokens' && (
              <TokensList filters={filters} hideHeader />
            )
          : null}
        {questsEnabled
          ? activeTab === 'quests' && <QuestList hideHeader />
          : null}
        {activeTab === 'contests' && <ExploreContestList hideHeader />}
        {activeTab === 'threads' && (
          <div className="threads-tab">
            <Feed
              query={useFetchGlobalActivityQuery}
              customScrollParent={containerRef.current}
            />
          </div>
        )}
        {activeTab === 'users' && (
          <div className="users-tab">
            <div className="users-xp-table">
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
              communitiesList={communitiesList}
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
