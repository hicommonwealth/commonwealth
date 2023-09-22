import React from 'react';
import { Skeleton } from 'views/components/Skeleton';
import './ReactionButton.scss';

export const ReactionButtonSkeleton = () => {
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      className={`ThreadReactionButton showSkeleton`}
    >
      <Skeleton height={52} width={40} />
    </button>
  );
};
