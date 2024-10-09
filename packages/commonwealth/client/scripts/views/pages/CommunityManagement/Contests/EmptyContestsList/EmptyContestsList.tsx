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
  hasWeightedTopic: boolean;
}

const EmptyContestsList = ({
  isStakeEnabled,
  isContestAvailable,
  onSetContestSelectionView,
  hasWeightedTopic,
}: EmptyContestsListProps) => {
  const navigate = useCommonNavigate();
  const farcasterContestEnabled = useFlag('farcasterContest');
  const weightedTopicsEnabled = useFlag('weightedTopics');

  return (
    <div className="EmptyContestsList">
      {(weightedTopicsEnabled ? !hasWeightedTopic : !isStakeEnabled) ? (
        <EmptyCard
          img={shape2Url}
          title={
            weightedTopicsEnabled
              ? 'You must have at least one topic with weighted voting enabled to run contest'
              : 'You must enable Community Stake'
          }
          subtitle={
            weightedTopicsEnabled
              ? 'Setting up a contest just takes a few minutes and can be a huge boost to your community.'
              : 'Contests require Community Stake...'
          }
          button={
            weightedTopicsEnabled
              ? {
                  label: 'Create a topic',
                  handler: () => navigate('/manage/topics'),
                }
              : {
                  label: 'Enable Community Stake',
                  handler: () => navigate('/manage/integrations'),
                }
          }
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
