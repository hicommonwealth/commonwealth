import React from 'react';

import farcasterUrl from 'assets/img/farcaster.svg';
import shape1Url from 'assets/img/shapes/shape1.svg';
import shape2Url from 'assets/img/shapes/shape2.svg';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';

import { ContestType, ContestView } from '../types';
import EmptyCard from './EmptyCard';

import './EmptyContestsList.scss';

interface EmptyContestsListProps {
  isContestAvailable: boolean;
  onSetContestView?: (type: ContestView) => void;
  hasWeightedTopic: boolean;
  hasNamespace: boolean;
}

const EmptyContestsList = ({
  isContestAvailable,
  onSetContestView,
  hasWeightedTopic,
  hasNamespace,
}: EmptyContestsListProps) => {
  const navigate = useCommonNavigate();
  const farcasterContestEnabled = useFlag('farcasterContest');

  return (
    <div className="EmptyContestsList">
      {!hasWeightedTopic ? (
        <>
          <EmptyCard
            img={shape2Url}
            title="You must have at least one topic with weighted voting enabled to run contest"
            subtitle="Setting up a contest just takes a few minutes and can be a huge boost to your community."
            button={{
              label: 'Create a topic',
              handler: () => navigate('/manage/topics'),
            }}
          />
          {farcasterContestEnabled && (
            <div className="farcaster-card">
              <EmptyCard
                img={farcasterUrl}
                title="Launch on Farcaster"
                subtitle="Farcaster contest does not require to create a weighted topic."
                button={{
                  label: 'Launch Farcaster contest',
                  handler: () => {
                    if (hasNamespace) {
                      return navigate(
                        `/manage/contests/launch?type=${ContestType.Farcaster}`,
                      );
                    }

                    onSetContestView?.(ContestView.NamespaceEnablemenement);
                  },
                }}
              />
            </div>
          )}
        </>
      ) : !isContestAvailable ? (
        <EmptyCard
          img={shape1Url}
          title="You haven’t launched any contests yet"
          subtitle="Setting up a contest just takes a few minutes and can be a huge boost to your community."
          button={{
            label: 'Launch a contest',
            handler: () =>
              farcasterContestEnabled
                ? onSetContestView?.(ContestView.TypeSelection)
                : navigate('/manage/contests/launch'),
          }}
        />
      ) : null}
    </div>
  );
};

export default EmptyContestsList;
