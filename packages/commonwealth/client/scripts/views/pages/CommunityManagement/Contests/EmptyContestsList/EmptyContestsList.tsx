import React from 'react';

import shape1Url from 'assets/img/shapes/shape1.svg';
import shape2Url from 'assets/img/shapes/shape2.svg';
import { useCommonNavigate } from 'navigation/helpers';

import EmptyCard from './EmptyCard';

import './EmptyContestsList.scss';

interface EmptyContestsListProps {
  isStakeEnabled: boolean;
  isContestAvailable: boolean;
}

const EmptyContestsList = ({
  isStakeEnabled,
  isContestAvailable,
}: EmptyContestsListProps) => {
  const navigate = useCommonNavigate();

  return (
    <div className="EmptyContestsList">
      {!isStakeEnabled ? (
        <EmptyCard
          img={shape2Url}
          title="You must enable Community Stake"
          subtitle="Contests require Community Stake..."
          button={{
            label: 'Enable Community Stake',
            handler: () => navigate('/manage/integrations'),
          }}
        />
      ) : !isContestAvailable ? (
        <EmptyCard
          img={shape1Url}
          title="You haven’t launched any contests yet"
          subtitle="Setting up a contest just takes a few minutes and can be a huge boost to your community."
          button={{
            label: 'Launch a contest',
            handler: () => navigate('/manage/contests/launch'),
          }}
        />
      ) : null}
    </div>
  );
};

export default EmptyContestsList;
