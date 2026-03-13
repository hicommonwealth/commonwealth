import React from 'react';
import { useFetchGlobalActivityQuery } from 'state/api/feeds/fetchUserActivity';
import XPTable from '../Leaderboard/XPTable/XPTable';
import AllTabContent from './AllTabContent';
import CommunitiesList from './CommunitiesList';
import ExploreContestList from './ExploreContestList';
import MarketsList from './MarketsList';
import PredictionMarketsList from './PredictionMarketsList';
import QuestList from './QuestList';
import { ThreadFeed } from './ThreadFeed/ThreadFeed';
import TokensList from './TokensList';

type ExplorePageContentProps = {
  activeTab: string;
  containerRef: React.MutableRefObject<HTMLElement | undefined>;
  ethUsdRate: number;
  historicalPrices:
    | { community_id: string; old_price?: string | null }[]
    | undefined;
  isCommunitiesDataLoading: boolean;
  marketsEnabled: boolean;
  onClearSearch: () => void;
  predictionMarketsEnabled: boolean;
  searchText: string;
  setSelectedCommunityId: (communityId: string) => void;
};

const ExplorePageContent = ({
  activeTab,
  containerRef,
  ethUsdRate,
  historicalPrices,
  isCommunitiesDataLoading,
  marketsEnabled,
  onClearSearch,
  predictionMarketsEnabled,
  searchText,
  setSelectedCommunityId,
}: ExplorePageContentProps) => {
  const sharedSearchProps = {
    onClearSearch,
    searchText,
  };

  if (activeTab === 'tokens') {
    return <TokensList hideHeader {...sharedSearchProps} />;
  }

  if (activeTab === 'quests') {
    return <QuestList hideHeader {...sharedSearchProps} />;
  }

  if (activeTab === 'contests') {
    return <ExploreContestList hideHeader {...sharedSearchProps} />;
  }

  if (activeTab === 'threads') {
    return (
      <div className="threads-tab">
        <ThreadFeed
          query={useFetchGlobalActivityQuery}
          customScrollParent={containerRef.current}
          {...sharedSearchProps}
        />
      </div>
    );
  }

  if (activeTab === 'users') {
    return (
      <div className="users-xp-table">
        <XPTable {...sharedSearchProps} />
      </div>
    );
  }

  if (marketsEnabled && activeTab === 'markets') {
    return <MarketsList hideHeader {...sharedSearchProps} />;
  }

  if (predictionMarketsEnabled && activeTab === 'prediction-markets') {
    return <PredictionMarketsList hideHeader {...sharedSearchProps} />;
  }

  if (activeTab === 'all') {
    return (
      <div className="section-container">
        <AllTabContent containerRef={containerRef} {...sharedSearchProps} />
      </div>
    );
  }

  if (activeTab === 'communities') {
    return (
      <CommunitiesList
        isLoading={isCommunitiesDataLoading}
        containerRef={containerRef}
        historicalPrices={historicalPrices}
        ethUsdRate={ethUsdRate}
        setSelectedCommunityId={setSelectedCommunityId}
        {...sharedSearchProps}
      />
    );
  }

  return null;
};

export default ExplorePageContent;
