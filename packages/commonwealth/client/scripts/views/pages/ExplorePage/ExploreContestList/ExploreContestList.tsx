import moment from 'moment';
import React from 'react';
import { trpc } from 'utils/trpcClient';
import ContestCard from 'views/components/ContestCard/ContestCard';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import useCommunityContests from '../../CommunityManagement/Contests/useCommunityContests';

import './ExploreContestList.scss';

type ExploreContestListProps = {
  hideHeader?: boolean;
};

const ExploreContestList = ({ hideHeader }: ExploreContestListProps) => {
  const {
    contestsData: { active: activeContests },
    isContestDataLoading,
  } = useCommunityContests({
    fetchAll: true,
  });

  const communityIds = [
    ...new Set(activeContests.map((contest) => contest.community_id)),
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
    <div className="ExploreContestList">
      {!hideHeader && <CWText type="h2">Contests</CWText>}
      <>
        {!isContestDataLoading && activeContests.length === 0 && (
          <CWText type="h2" className="empty-contests">
            No active contests found
          </CWText>
        )}
        {isContestDataLoading ? (
          <div className="content">
            <>
              <Skeleton height="300px" />
              <Skeleton height="300px" />
            </>
          </div>
        ) : (
          <div className="content">
            {activeContests.map((contest) => {
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
                  finishDate={end_time ? moment(end_time).toISOString() : ''}
                  isCancelled={contest.cancelled}
                  isRecurring={!contest.funding_token_address}
                  payoutStructure={contest.payout_structure}
                  score={score || []}
                  isFarcaster={contest.is_farcaster_contest}
                  community={community[contest.community_id as string]}
                  hideWhenNoPrizes={true}
                />
              );
            })}
          </div>
        )}
      </>
    </div>
  );
};

export default ExploreContestList;
