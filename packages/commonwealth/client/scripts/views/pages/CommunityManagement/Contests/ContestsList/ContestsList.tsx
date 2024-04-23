import React from 'react';

import { Skeleton } from 'views/components/Skeleton';

import EmptyContestsList from '../EmptyContestsList';
import ContestCard from './ContestCard';

import './ContestsList.scss';

interface ContestsListProps {
  contests: {
    id: number;
    name: string;
    imageUrl?: string;
    finishDate: string;
    topics: string[];
    payouts: number[];
    isActive: boolean;
  }[];
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
    <div className="ContestsList">
      {isAdmin && (!stakeEnabled || !isContestAvailable) ? (
        <EmptyContestsList
          isStakeEnabled={stakeEnabled}
          isContestAvailable={isContestAvailable}
        />
      ) : (
        contests.map(
          ({ id, name, imageUrl, finishDate, topics, payouts, isActive }) => (
            <ContestCard
              key={id}
              isAdmin={isAdmin}
              id={id}
              name={name}
              imageUrl={imageUrl}
              topics={topics}
              payouts={payouts}
              finishDate={finishDate}
              isActive={isActive}
            />
          ),
        )
      )}
    </div>
  );
};

export default ContestsList;
