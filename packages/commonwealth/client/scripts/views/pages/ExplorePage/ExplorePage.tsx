import { findDenominationString } from 'helpers/findDenomination';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import CWTab from 'views/components/component_kit/new_designs/CWTabs/CWTab';
import CWTabsRow from 'views/components/component_kit/new_designs/CWTabs/CWTabsRow';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { Feed } from 'views/components/feed';
import CreateCommunityButton from 'views/components/sidebar/CreateCommunityButton';
import { useFetchTokenUsdRateQuery } from '../../../state/api/communityStake/index';
import { useFetchGlobalActivityQuery } from '../../../state/api/feeds/fetchUserActivity';
import { trpc } from '../../../utils/trpcClient';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import XPTable from '../Leaderboard/XPTable/XPTable';
import AllTabContent from './AllTabContent';
import CommunitiesList from './CommunitiesList';
import ExploreContestList from './ExploreContestList';
import './ExplorePage.scss';
import IdeaLaunchpad from './IdeaLaunchpad';
import QuestList from './QuestList';
import TokensList from './TokensList';

const ExplorePage = () => {
  const containerRef = useRef();
  const launchpadEnabled = useFlag('launchpad');
  const questsEnabled = useFlag('xp');
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState<string>('');

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

  const [selectedCommunityId, setSelectedCommunityId] = useState<string>();

  const oneDayAgo = useRef(new Date().getTime() - 24 * 60 * 60 * 1000);

  const { data: historicalPrices, isLoading: isLoadingHistoricalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: oneDayAgo.current / 1000, // 24 hours ago
    });

  const { data: ethUsdRateData, isLoading: isLoadingEthUsdRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  const isLoading = isLoadingHistoricalPrices || isLoadingEthUsdRate;

  // Function to handle tab switching
  const handleTabClick = (tabValue: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabValue);
    navigate(`/explore?${params.toString()}`);
  };

  return (
    // @ts-expect-error <StrictNullChecks/>
    <CWPageLayout ref={containerRef} className="ExplorePageLayout">
      <div className="ExplorePage">
        <div className="header-section">
          <div className="description">
            <CWText
              type="h1"
              {...(launchpadEnabled && { fontWeight: 'semiBold' })}
            >
              Explore {launchpadEnabled ? '' : 'Communities'}
            </CWText>

            <div className="actions">
              {!launchpadEnabled && (
                <CreateCommunityButton buttonHeight="med" withIcon />
              )}
            </div>
          </div>

          <IdeaLaunchpad />

          <CWTextInput
            placeholder={`Search ${activeTab}`}
            value={searchText}
            onInput={(e) => setSearchText(e?.target?.value)}
            fullWidth
            iconLeft={<CWIcon iconName="search" />}
          />

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
        {launchpadEnabled
          ? activeTab === 'tokens' && (
              <TokensList
                hideHeader
                searchText={searchText}
                onClearSearch={() => setSearchText('')}
              />
            )
          : null}
        {questsEnabled
          ? activeTab === 'quests' && (
              <QuestList
                hideHeader
                searchText={searchText}
                onClearSearch={() => setSearchText('')}
              />
            )
          : null}
        {activeTab === 'contests' && (
          <ExploreContestList
            hideHeader
            searchText={searchText}
            onClearSearch={() => setSearchText('')}
          />
        )}
        {activeTab === 'threads' && (
          <div className="threads-tab">
            <Feed
              query={useFetchGlobalActivityQuery}
              customScrollParent={containerRef.current}
              searchText={searchText}
              onClearSearch={() => setSearchText('')}
            />
          </div>
        )}
        {activeTab === 'users' && (
          <div className="users-xp-table">
            <XPTable
              searchText={searchText}
              onClearSearch={() => setSearchText('')}
            />
          </div>
        )}

        {/* All tab - show all content types */}
        {activeTab === 'all' && (
          <>
            {/* Communities section */}
            <div className="section-container">
              <AllTabContent
                containerRef={containerRef}
                searchText={searchText}
                onClearSearch={() => setSearchText('')}
              />
            </div>
          </>
        )}

        {/* Communities Tab Content */}
        {activeTab === 'communities' && (
          <>
            <CommunitiesList
              isLoading={isLoading}
              containerRef={containerRef}
              historicalPrices={historicalPrices}
              ethUsdRate={Number(ethUsdRate)}
              setSelectedCommunityId={setSelectedCommunityId}
              searchText={searchText}
              onClearSearch={() => setSearchText('')}
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

export default ExplorePage;
