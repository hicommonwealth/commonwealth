import { findDenominationString } from 'helpers/findDenomination';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetchQuestsQuery } from 'state/api/quest';
import useCommunitiesPageStore from 'state/ui/communitiesPage';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { trpc } from '../../../utils/trpcClient';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import CWTab from '../../components/component_kit/new_designs/CWTabs/CWTab';
import CWTabsRow from '../../components/component_kit/new_designs/CWTabs/CWTabsRow';
import CreateCommunityButton from '../../components/sidebar/CreateCommunityButton';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import useCommunityContests from '../CommunityManagement/Contests/useCommunityContests';
import './Communities.scss';
import IdeaLaunchpad from './IdeaLaunchpad';
import SearchFilterRow from './SearchFilterRow';
import { getCommunityCountsString } from './helpers';
import { useCommunityData } from './hooks/useCommunityData';
import { createTabsConfig } from './tabConfig';

const CommunitiesPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const launchpadEnabled = useFlag('launchpad');
  const questsEnabled = useFlag('xp');
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();
  const { isWindowSmallInclusive } = useBrowserWindow({});

  // Get the active tab from URL parameters
  const activeTab = searchParams.get('tab') || 'all';

  // Use the Zustand store for state management
  const {
    searchValue,
    setSearchValue,
    selectedViewType,
    setSelectedViewType,
    filters,
    setFilters,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    selectedQuestFilter,
    setSelectedQuestFilter,
    selectedQuestStage,
    setSelectedQuestStage,
    questFilterTags,
    setQuestFilterTags,
    selectedContestStage,
    setSelectedContestStage,
    selectedContestCommunityId,
    setSelectedContestCommunityId,
    contestFilterTags,
    setContestFilterTags,
    threadsFilterCommunityId,
    setThreadsFilterCommunityId,
    threadsSortOption,
    setThreadsSortOption,
    threadsFilterTags,
    setThreadsFilterTags,
    threadFilterKey,
    setThreadFilterKey,
    tokensFilterTag,
    setTokensFilterTag,
    tokensSortOption,
    setTokensSortOption,
    tokensFilterTags,
    setTokensFilterTags,
    resetTabState,
  } = useCommunitiesPageStore();

  // Use the community data hook
  const {
    communities,
    communitiesList,
    filteredCommunitiesList,
    fetchMoreCommunities,
    hasNextPage,
    isLoading,
    isInitialCommunitiesLoading,
    historicalPrices,
    ethUsdRate,
    tags,
  } = useCommunityData(filters, searchValue);

  // State for community ID for the stake modal
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>();

  // Stake modal state from the modal store
  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  // Fetch quests for the Users tab inline filter
  const { data: questsList } = useFetchQuestsQuery({
    limit: 50,
    include_system_quests: true,
    cursor: 1,
    enabled: questsEnabled,
  });

  // Create quest options for filters
  const questOptions = useMemo(() => {
    const quests = (questsList?.pages || []).flatMap((page) => page.results);
    return quests.map((quest) => ({
      value: quest.id.toString(),
      label: quest.name,
    }));
  }, [questsList]);

  // Pre-fetch contest data for the contest tab
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

  // Create content for communities count display
  const communitiesCount = (
    <CWText type="b2" className="communities-count">
      {!isLoading && communities?.pages?.[0]?.totalResults
        ? getCommunityCountsString(communities?.pages?.[0]?.totalResults)
        : 'No communities found'}
    </CWText>
  );

  // Get the tabs configuration
  const { getEnabledTabs } = createTabsConfig();

  // Get enabled tabs based on feature flags
  const enabledTabs = useMemo(() => {
    return getEnabledTabs({
      launchpad: launchpadEnabled,
      xp: questsEnabled,
    });
  }, [launchpadEnabled, questsEnabled, getEnabledTabs]);

  // Function to handle tab switching
  const handleTabClick = useCallback(
    (tabValue: string) => {
      const params = new URLSearchParams(searchParams);
      params.set('tab', tabValue);
      navigate(`/explore?${params.toString()}`);
      resetTabState();
    },
    [navigate, searchParams, resetTabState],
  );

  // Get the current tab configuration
  const currentTabConfig = useMemo(() => {
    return enabledTabs.find((tab) => tab.key === activeTab) || enabledTabs[0];
  }, [enabledTabs, activeTab]);

  // Prepare props for tab content
  const tabContentProps = {
    searchValue,
    setSearchValue,
    selectedViewType,
    setSelectedViewType,
    filters,
    setFilters,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    containerRef,
    communitiesList,
    filteredCommunitiesList,
    hasNextPage,
    fetchMoreCommunities,
    isLoading,
    isInitialCommunitiesLoading,
    historicalPrices,
    ethUsdRate,
    selectedCommunityId,
    setSelectedCommunityId,
    communities,
    tags,
    // Tab-specific states
    selectedQuestFilter,
    setSelectedQuestFilter,
    selectedQuestStage,
    setSelectedQuestStage,
    questFilterTags,
    setQuestFilterTags,
    selectedContestStage,
    setSelectedContestStage,
    selectedContestCommunityId,
    setSelectedContestCommunityId,
    contestFilterTags,
    setContestFilterTags,
    threadsFilterCommunityId,
    setThreadsFilterCommunityId,
    threadsSortOption,
    setThreadsSortOption,
    threadsFilterTags,
    setThreadsFilterTags,
    threadFilterKey,
    setThreadFilterKey,
    tokensFilterTag,
    setTokensFilterTag,
    tokensSortOption,
    setTokensSortOption,
    tokensFilterTags,
    setTokensFilterTags,
    // Additional props
    contestCommunityOptions,
    questOptions,
  };

  return (
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
            {enabledTabs.map((tab) => (
              <CWTab
                key={tab.key}
                label={tab.label}
                isSelected={activeTab === tab.key}
                onClick={() => handleTabClick(tab.key)}
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
              onFilterClick={currentTabConfig.getFilterClickHandler?.(
                tabContentProps,
              )}
              filterTags={
                currentTabConfig.getFilterTags?.(tabContentProps) || []
              }
              placeholder={`Search ${activeTab}`}
              showViewToggle={currentTabConfig.showViewToggle}
              inlineFilters={
                currentTabConfig.getInlineFilters?.(tabContentProps) || []
              }
            />
          )}
        </div>

        {/* Render the content for the current tab */}
        {currentTabConfig.getContent(tabContentProps)}

        {/* Stake Modal */}
        <CWModal
          size="small"
          content={
            <ManageCommunityStakeModal
              mode={modeOfManageCommunityStakeModal}
              onModalClose={() =>
                setModeOfManageCommunityStakeModal(null as any)
              }
              denomination={
                findDenominationString(selectedCommunityId || '') || 'ETH'
              }
            />
          }
          onClose={() => setModeOfManageCommunityStakeModal(null as any)}
          open={!!modeOfManageCommunityStakeModal}
        />
      </div>
    </CWPageLayout>
  );
};

export default CommunitiesPage;
