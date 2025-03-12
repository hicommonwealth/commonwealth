import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainNetwork, CommunityType } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { findDenominationString } from 'helpers/findDenomination';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import { useFetchTagsQuery } from 'state/api/tags';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { z } from 'zod';
import { useFetchTokenUsdRateQuery } from '../../../state/api/communityStake/index';
import { trpc } from '../../../utils/trpcClient';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import CWTab from '../../components/component_kit/new_designs/CWTabs/CWTab';
import CWTabsRow from '../../components/component_kit/new_designs/CWTabs/CWTabsRow';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import CreateCommunityButton from '../../components/sidebar/CreateCommunityButton';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import { XPEarningsTable } from '../../pages/RewardsPage/tables/XPEarningsTable/XPEarningsTable';
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
import TokensList from './TokensList';
import { getCommunityCountsString } from './helpers';

type ExtendedCommunityType = z.infer<typeof ExtendedCommunity>;
type ExtendedCommunitySliceType = [
  ExtendedCommunityType,
  ExtendedCommunityType,
];

// Define available tab views
const TAB_VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'communities', label: 'Communities' },
  // { value: 'threads', label: 'Threads' },
  { value: 'users', label: 'Users' },
  { value: 'quests', label: 'Quests' },
  { value: 'contests', label: 'Contests' },
  // { value: 'transactions', label: 'Transactions' },
  { value: 'tokens', label: 'Tokens' },
];

const CommunitiesPage = () => {
  const containerRef = useRef();
  const launchpadEnabled = useFlag('launchpad');
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();

  // Add state for tracking active tab
  const activeTab = searchParams.get('tab') || 'all';

  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

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

  const [selectedCommunityId, setSelectedCommunityId] = useState<string>();

  const user = useUserStore();
  const oneDayAgo = useRef(new Date().getTime() - 24 * 60 * 60 * 1000);

  const { data: tags, isLoading: isLoadingTags } = useFetchTagsQuery();

  const { isWindowSmallInclusive } = useBrowserWindow({});

  const {
    data: communities,
    fetchNextPage: fetchMoreCommunities,
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

  const { data: historicalPrices, isLoading: isLoadingHistoricalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: oneDayAgo.current / 1000, // 24 hours ago
    });

  const { data: ethUsdRateData, isLoading: isLoadingEthUsdRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

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
              Explore {launchpadEnabled ? '' : 'Communities'}
            </CWText>

            {isWindowSmallInclusive ? communitiesCount : <></>}
            <div className="actions">
              {!isWindowSmallInclusive ? communitiesCount : <></>}
              <CreateCommunityButton buttonHeight="med" withIcon />
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
        </div>

        {/* Conditionally render content based on active tab */}
        {activeTab === 'tokens' && <TokensList filters={filters} />}
        {activeTab === 'quests' && <QuestList />}
        {activeTab === 'contests' && <ExploreContestList />}
        {activeTab === 'users' && (
          <div className="users-tab">
            <div className="tab-header">
              <CWText type="h2">Users</CWText>
            </div>
            <div className="users-xp-table">
              <XPEarningsTable />
            </div>
          </div>
        )}

        {/* All tab - show all content types */}
        {activeTab === 'all' && (
          <>
            {/* Communities section */}
            <div className="section-container">
              <AllTabContent
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
                hideHeader={false}
              />
            </div>
          </>
        )}

        {/* Communities Tab Content */}
        {activeTab === 'communities' && (
          <>
            <div
              className={clsx('filters', {
                hasAppliedFilter:
                  Object.values(filters).filter(Boolean).length === 1
                    ? !filters.withCommunitySortOrder
                    : Object.values(filters).filter(Boolean).length > 0,
              })}
            >
              <CWButton
                label="Filters"
                iconRight="funnelSimple"
                buttonType="secondary"
                onClick={() => setIsFilterDrawerOpen((isOpen) => !isOpen)}
              />
              {filters.withCommunitySortBy && (
                <CWTag
                  label={`${filters.withCommunitySortBy}${
                    filters.withCommunitySortOrder &&
                    filters.withCommunitySortBy !==
                      CommunitySortOptions.MostRecent
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
                  label="Stake"
                  type="filter"
                  onCloseClick={removeStakeFilter}
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

        {/* Default fallback if tab is not recognized */}
        {!TAB_VIEWS.find((tab) => tab.value === activeTab) && (
          <>
            <div
              className={clsx('filters', {
                hasAppliedFilter:
                  Object.values(filters).filter(Boolean).length === 1
                    ? !filters.withCommunitySortOrder
                    : Object.values(filters).filter(Boolean).length > 0,
              })}
            >
              <CWButton
                label="Filters"
                iconRight="funnelSimple"
                buttonType="secondary"
                onClick={() => setIsFilterDrawerOpen((isOpen) => !isOpen)}
              />
              {filters.withCommunitySortBy && (
                <CWTag
                  label={`${filters.withCommunitySortBy}${
                    filters.withCommunitySortOrder &&
                    filters.withCommunitySortBy !==
                      CommunitySortOptions.MostRecent
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
                  label="Stake"
                  type="filter"
                  onCloseClick={removeStakeFilter}
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
