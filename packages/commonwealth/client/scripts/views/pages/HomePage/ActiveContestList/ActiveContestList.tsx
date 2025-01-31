import React from 'react';
import { trpc } from 'utils/trpcClient';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import useCommunityContests from '../../CommunityManagement/Contests/useCommunityContests';

import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { Link } from 'react-router-dom';
import ActiveContestCard from '../ActiveContestCard/ActiveContestCard';
import './ActiveContestList.scss';

const ActiveContestList = () => {
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
    <div className="ActiveContestList">
      <div className="heading-container">
        <CWText type="h2">Contests</CWText>
        <Link to="/explore">
          <div className="link-right">
            <CWText className="link">See all contests</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
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
              <ActiveContestCard
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

export default ActiveContestList;
