import moment from 'moment';
import React, { useMemo } from 'react';
import { trpc } from 'utils/trpcClient';
import ContestCard from 'views/components/ContestCard/ContestCard';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import useCommunityContests from '../../CommunityManagement/Contests/useCommunityContests';

import './ExploreContestList.scss';

export enum ContestStage {
  Active = 'active',
  Past = 'past',
}

type ExploreContestListProps = {
  hideHeader?: boolean;
  contestStage?: ContestStage;
  selectedCommunityId?: string;
  searchValue?: string;
};

const ExploreContestList = ({
  hideHeader,
  contestStage,
  selectedCommunityId,
  searchValue,
}: ExploreContestListProps) => {
  const {
    contestsData: { active: activeContests, finished: pastContests },
    isContestDataLoading,
  } = useCommunityContests({
    fetchAll: true,
  });

  // First, filter by community if selected
  const filteredActiveContests = selectedCommunityId
    ? activeContests.filter(
        (contest) => contest.community_id === selectedCommunityId,
      )
    : activeContests;

  const filteredPastContests = selectedCommunityId
    ? pastContests.filter(
        (contest) => contest.community_id === selectedCommunityId,
      )
    : pastContests;

  // For ALL selection: show both active and past contests, with active first
  const contestsToShow = useMemo(() => {
    if (!contestStage) {
      // For "All" option, show both active and past, but active first
      return [...filteredActiveContests, ...filteredPastContests];
    } else if (contestStage === ContestStage.Active) {
      return filteredActiveContests;
    } else {
      return filteredPastContests;
    }
  }, [contestStage, filteredActiveContests, filteredPastContests]);

  // Add search filtering
  const searchedContestsToShow = useMemo(() => {
    if (!searchValue) {
      return contestsToShow;
    }
    const lowerSearchValue = searchValue.toLowerCase();
    return contestsToShow.filter((contest) =>
      contest.name?.toLowerCase().includes(lowerSearchValue),
    );
  }, [contestsToShow, searchValue]);

  const communityIds = useMemo(
    () => [...new Set(contestsToShow.map((contest) => contest.community_id))],
    [contestsToShow],
  );

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

  // Create a display message based on filters and contest availability
  const getEmptyStateMessage = () => {
    if (selectedCommunityId) {
      if (!contestStage) {
        return 'No contests found for the selected community';
      }
      return `No ${contestStage === ContestStage.Active ? 'active' : 'past'} contests found for the selected community`;
    }

    if (!contestStage) {
      return 'No contests found';
    }
    return `No ${contestStage === ContestStage.Active ? 'active' : 'past'} contests found`;
  };

  return (
    <div className="ExploreContestList">
      {!hideHeader && <CWText type="h2">Contests</CWText>}

      <>
        {!isContestDataLoading && searchedContestsToShow.length === 0 && (
          <CWText type="h2" className="empty-contests">
            {getEmptyStateMessage()}
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
            {searchedContestsToShow.map((contest) => {
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
