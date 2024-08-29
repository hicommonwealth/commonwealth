import React from 'react';

import shape1Url from 'assets/img/shapes/shape1.svg';
import shape2Url from 'assets/img/shapes/shape2.svg';
import { useCommonNavigate } from 'navigation/helpers';

import EmptyCard from './EmptyCard';

import { useFlag } from 'hooks/useFlag';
import './EmptyContestsList.scss';

interface EmptyContestsListProps {
  isStakeEnabled: boolean;
  isContestAvailable: boolean;
  onSetContestSelectionView?: () => void;
}

const EmptyContestsList = ({
  isStakeEnabled,
  isContestAvailable,
  onSetContestSelectionView,
}: EmptyContestsListProps) => {
  const navigate = useCommonNavigate();
  const farcasterContestEnabled = useFlag('farcasterContest');

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
            handler: () =>
              farcasterContestEnabled
                ? onSetContestSelectionView?.()
                : navigate('/manage/contests/launch'),
          }}
        />
      ) : null}
    </div>
  );
};

export default EmptyContestsList;
