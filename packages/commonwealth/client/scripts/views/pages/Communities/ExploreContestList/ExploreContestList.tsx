import React from 'react';
import { trpc } from 'utils/trpcClient';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import useCommunityContests from '../../CommunityManagement/Contests/useCommunityContests';
import ExploreContestCard from './ExploreContestCard';

import './ExploreContestList.scss';

const ExploreContestList = () => {
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
      },
    };
  }, {});

  return (
    <div className="ExploreContestList">
      <CWText type="h2">Contests</CWText>
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
            {activeContests.map((contest) => (
              <ExploreContestCard
                key={contest.contest_address}
                contest={contest}
                community={community[contest.community_id as string]}
              />
            ))}
          </div>
        )}
      </>
    </div>
  );
};

export default ExploreContestList;
