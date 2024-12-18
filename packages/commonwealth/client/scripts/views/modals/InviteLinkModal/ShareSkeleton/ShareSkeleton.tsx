import React from 'react';

import { Skeleton } from 'views/components/Skeleton';

import './ShareSkeleton.scss';

export const ShareSkeleton = () => {
  return (
    <div className="ShareSkeleton">
      <Skeleton height={40} />
      <Skeleton height={24} width={65} />

      <div className="share-options">
        <Skeleton height={48} width={48} />
        <Skeleton height={48} width={48} />
        <Skeleton height={48} width={48} />
        <Skeleton height={48} width={48} />
        <Skeleton height={48} width={48} />
        <Skeleton height={48} width={48} />
      </div>
    </div>
  );
};
