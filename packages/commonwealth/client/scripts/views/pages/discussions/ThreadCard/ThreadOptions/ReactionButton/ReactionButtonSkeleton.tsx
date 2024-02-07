import React from 'react';
import { Skeleton } from 'views/components/Skeleton';
import './ReactionButtonSkeleton.scss';

export const ReactionButtonSkeleton = () => {
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      className="ReactionButtonSkeleton"
    >
      <Skeleton height={52} width={40} />
    </button>
  );
};
