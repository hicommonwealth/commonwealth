import React from 'react';
import { trpc } from 'utils/trpcClient';
import useCommunityContests from '../../CommunityManagement/Contests/useCommunityContests';
import ContestCard from './ContestCard';

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
    communityIds.map((id) => t.community.getCommunity({ id: id! })),
  );

  const communityIcons = communityIds.reduce((acc, id, index) => {
    const communityData = communityQueries[index].data;
    return {
      ...acc,
      [id as string]: {
        name: communityData?.name || '',
        iconUrl: communityData?.icon_url || '',
      },
    };
  }, {});

  return (
    <div className="ContestList">
      {isContestDataLoading ? (
        <div>Loading...</div>
      ) : (
        activeContests.map((contest) => (
          <ContestCard
            key={contest.contest_address}
            contest={contest}
            community={communityIcons[contest.community_id as string]}
          />
        ))
      )}
    </div>
  );
};

export default ContestList;
