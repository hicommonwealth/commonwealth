import React from 'react';
import { trpc } from 'utils/trpcClient';
import useCommunityContests from '../../CommunityManagement/Contests/useCommunityContests';
import ContestCard from './ContestCard';

import { Skeleton } from 'client/scripts/views/components/Skeleton';
import './ContestList.scss';

const ContestList = () => {
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
    <div className="ContestList">
      {isContestDataLoading ? (
        // TODO: adjust width and height
        <Skeleton width={'100%'} height={'200px'} />
      ) : (
        activeContests.map((contest) => (
          <ContestCard
            key={contest.contest_address}
            contest={contest}
            community={community[contest.community_id as string]}
          />
        ))
      )}
    </div>
  );
};

export default ContestList;
