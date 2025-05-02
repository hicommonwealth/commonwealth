import { findDenominationString } from 'helpers/findDenomination';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
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

  const { isWindowSmallInclusive } = useBrowserWindow({});

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

  const communitiesCount = <></>; // TODO: fix this

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
        </div>

        {/* Conditionally render content based on active tab */}
        {launchpadEnabled
          ? activeTab === 'tokens' && <TokensList hideHeader />
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
              <XPTable />
            </div>
          </div>
        )}

        {/* All tab - show all content types */}
        {activeTab === 'all' && (
          <>
            {/* Communities section */}
            <div className="section-container">
              <AllTabContent containerRef={containerRef} />
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
