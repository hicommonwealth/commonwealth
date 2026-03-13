import React, { type ReactNode } from 'react';
import { useFetchGlobalActivityQuery } from 'state/api/feeds/fetchUserActivity';
import ActiveContestList from './ActiveContestList/ActiveContestList';
import ActivePredictionMarketList from './ActivePredictionMarketList/ActivePredictionMarketList';
import TrendingThreadList from './TrendingThreadList/TrendingThreadList';
import XpQuestList from './XpQuestList/XpQuestList';

type HomeDiscoverySectionsProps = {
  afterPredictionMarkets?: ReactNode;
  communityIdFilter?: string;
  isCommunityHomePage?: boolean;
  threadPlacement?: 'end' | 'start';
};

const HomeDiscoverySections = ({
  afterPredictionMarkets,
  communityIdFilter,
  isCommunityHomePage,
  threadPlacement = 'end',
}: HomeDiscoverySectionsProps) => {
  const trendingThreads = (
    <TrendingThreadList
      query={useFetchGlobalActivityQuery}
      communityIdFilter={communityIdFilter}
    />
  );

  return (
    <>
      {threadPlacement === 'start' && trendingThreads}
      <ActiveContestList isCommunityHomePage={isCommunityHomePage} />
      <ActivePredictionMarketList
        isCommunityHomePage={isCommunityHomePage}
        communityIdFilter={communityIdFilter}
      />
      {afterPredictionMarkets}
      <XpQuestList communityIdFilter={communityIdFilter} />
      {threadPlacement === 'end' && trendingThreads}
    </>
  );
};

export default HomeDiscoverySections;
