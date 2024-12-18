import React from 'react';

import shape1Url from 'assets/img/shapes/shape1.svg';

import { ContestView } from '../types';
import EmptyCard from './EmptyCard';

import './EmptyContestsList.scss';

interface EmptyContestsListProps {
  onSetContestView?: (type: ContestView) => void;
}

const EmptyContestsList = ({ onSetContestView }: EmptyContestsListProps) => {
  return (
    <div className="EmptyContestsList">
      <EmptyCard
        img={shape1Url}
        title="You haven’t launched any contests yet"
        subtitle="Setting up a contest just takes a few minutes and can be a huge boost to your community."
        button={{
          label: 'Launch a contest',
          handler: () => onSetContestView?.(ContestView.TypeSelection),
        }}
      />
    </div>
  );
};

export default EmptyContestsList;
