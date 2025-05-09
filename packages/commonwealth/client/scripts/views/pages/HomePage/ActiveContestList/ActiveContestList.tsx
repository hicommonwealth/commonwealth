import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { useTokenPricing } from 'hooks/useTokenPricing';
import moment from 'moment';
import React from 'react';
import { Link } from 'react-router-dom';
import { trpc } from 'utils/trpcClient';
import { CWText } from 'views/components/component_kit/cw_text';
import ContestCard from 'views/components/ContestCard';
import { PotentialContestCard } from 'views/components/PotentialContestCard/PotentialContestCard';
import { useTokenTradeWidget } from 'views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import { Skeleton } from 'views/components/Skeleton';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import useCommunityContests from '../../CommunityManagement/Contests/useCommunityContests';

import './ActiveContestList.scss';

interface ActiveContestListProps {
  isCommunityHomePage?: boolean;
}

const useConditionalTokenData = (isCommunityHomePage: boolean) => {
  const { communityToken, isLoadingToken, isPinnedToken } =
    useTokenTradeWidget();
  const { isLoading: isLoadingPricing } = useTokenPricing({
    token: communityToken as LaunchpadToken,
  });

  if (!isCommunityHomePage) {
    return {
      communityToken: null,
      isLoadingToken: false,
      isPinnedToken: false,
      isLoadingPricing: false,
    };
  }

  // Return actual hook results when on community page
  return { communityToken, isLoadingToken, isPinnedToken, isLoadingPricing };
};

const ActiveContestList = ({
  isCommunityHomePage = false,
}: ActiveContestListProps) => {
  const {
    contestsData: { active: activeContests, suggested: suggestedContest },
    isContestDataLoading,
    isSuggestedMode,
  } = useCommunityContests({
    fetchAll: true,
    isCommunityHomePage,
  });

  const { communityToken, isLoadingToken, isPinnedToken, isLoadingPricing } =
    useConditionalTokenData(isCommunityHomePage);

  const isLoading = isContestDataLoading || isLoadingToken || isLoadingPricing;

  const isLaunchpadToken = communityToken && !isPinnedToken;
  const launchpadToken = communityToken as LaunchpadToken;
  const isGraduated = launchpadToken?.liquidity_transferred;
  const hasActiveContests = activeContests.length > 0;

  const showPotentialCardCase1 =
    isLaunchpadToken && !isGraduated && !hasActiveContests;
  const showPotentialCardCase2 =
    isLaunchpadToken && !isGraduated && hasActiveContests;

  const shouldRenderPotentialCard =
    showPotentialCardCase1 || showPotentialCardCase2;

  const activeContestsLimited = isCommunityHomePage
    ? activeContests.length > 0
      ? activeContests.slice(0, 3)
      : suggestedContest.slice(0, 3) || []
    : activeContests.slice(0, 3);

  const communityIds = [
    ...new Set(activeContestsLimited.map((contest) => contest.community_id)),
  ];

  const communityQueries = trpc.useQueries((t) =>
    communityIds.map((id) =>
      t.community.getCommunity({ id: id!, include_node_info: true }),
    ),
  );

  const community = communityIds.reduce((acc, id, index) => {
    const communityData = communityQueries[index].data;
    return {
      ...acc,
      [id as string]: {
        name: communityData?.name || '',
        iconUrl: communityData?.icon_url || '',
        chainNodeUrl: communityData?.ChainNode?.url,
        ethChainId: communityData?.ChainNode?.eth_chain_id,
        id: communityData?.id,
      },
    };
  }, {});

  return (
    <div className="ActiveContestList">
      <div className="heading-container">
        <CWText type="h2">Contests</CWText>
        <Link to="/explore?tab=contests">
          <div className="link-right">
            <CWText className="link">See all contests</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
      {isSuggestedMode && !shouldRenderPotentialCard && (
        <CWText type="h5">Suggested</CWText>
      )}
      <>
        {shouldRenderPotentialCard && <PotentialContestCard />}
        {!isLoading &&
          !shouldRenderPotentialCard &&
          !isCommunityHomePage &&
          !hasActiveContests && (
            <CWText type="h2" className="empty-contests">
              No active contests found
            </CWText>
          )}
        {isLoading ? (
          <div className="content">
            <>
              <Skeleton height="300px" />
              <Skeleton height="300px" />
            </>
          </div>
        ) : (
          <div className="content">
            {activeContestsLimited.map((contest) => {
              const sortedContests = (contest?.contests || []).toSorted(
                (a, b) => (moment(a.end_time).isBefore(b.end_time) ? -1 : 1),
              );

              const { end_time, score } =
                sortedContests[sortedContests.length - 1] || {};

              return (
                <ContestCard
                  key={contest.contest_address}
                  isAdmin={false}
                  address={contest.contest_address || ''}
                  name={contest.name || ''}
                  imageUrl={contest.image_url || ''}
                  topics={contest.topics || []}
                  decimals={contest.decimals}
                  ticker={contest.ticker}
                  prizePercentage={contest.prize_percentage || undefined}
                  finishDate={end_time ? moment(end_time).toISOString() : ''}
                  isCancelled={contest.cancelled}
                  isRecurring={!contest.funding_token_address}
                  payoutStructure={contest.payout_structure}
                  score={score || []}
                  isFarcaster={contest.is_farcaster_contest}
                  community={community[contest.community_id as string]}
                />
              );
            })}
          </div>
        )}
      </>
    </div>
  );
};

export default ActiveContestList;
