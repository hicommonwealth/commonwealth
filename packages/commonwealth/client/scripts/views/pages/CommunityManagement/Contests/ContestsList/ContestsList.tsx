import React, { useState } from 'react';

import { Skeleton } from 'views/components/Skeleton';

import EmptyContestsList from '../EmptyContestsList';
import FundContestDrawer from '../FundContestDrawer';
import mockedContests from '../mockedContests';
import ContestCard from './ContestCard';

import './ContestsList.scss';

interface ContestsListProps {
  contests: typeof mockedContests;
  isAdmin: boolean;
  isLoading: boolean;
  stakeEnabled: boolean;
  isContestAvailable: boolean;
}
const ContestsList = ({
  contests,
  isAdmin,
  isLoading,
  stakeEnabled,
  isContestAvailable,
}: ContestsListProps) => {
  const [fundDrawerAddress, setFundDrawerAddress] = useState('');

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="ContestsListSkeleton" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="ContestsList">
        {isAdmin && (!stakeEnabled || !isContestAvailable) ? (
          <EmptyContestsList
            isStakeEnabled={stakeEnabled}
            isContestAvailable={isContestAvailable}
          />
        ) : (
          contests.map((contest) => {
            // only last contest is relevant
            const { end_time, winners } =
              contest.contests[contest.contests.length - 1];

            return (
              <ContestCard
                key={contest.contest_address}
                isAdmin={isAdmin}
                address={contest.contest_address}
                name={contest.name}
                imageUrl={contest.image_url}
                topics={contest.topics}
                winners={winners}
                finishDate={end_time.toISOString()}
                isActive={!contest.paused}
                onFund={() =>
                  setFundDrawerAddress(
                    contest.funding_token_address || 'stake address',
                  )
                }
              />
            );
          })
        )}
      </div>
      <FundContestDrawer
        onClose={() => setFundDrawerAddress('')}
        isOpen={!!fundDrawerAddress}
        contestAddress={fundDrawerAddress}
      />
    </>
  );
};

export default ContestsList;
