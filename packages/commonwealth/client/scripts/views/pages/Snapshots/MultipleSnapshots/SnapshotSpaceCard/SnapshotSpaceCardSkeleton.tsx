import React from 'react';

import { CWCard } from 'views/components/component_kit/cw_card';
import { Skeleton } from 'views/components/Skeleton';

import './SnapshotSpaceCard.scss';

export const SnapshotSpaceCardSkeleton = () => {
  return (
    <CWCard
      elevation="elevation-2"
      className="SnapshotSpaceCard"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div className="space-card-container">
        <div className="space-card-metadata">
          <div className="space-card-title">
            <Skeleton />
          </div>
          <div className="space-card-subheader">
            <Skeleton />
          </div>
        </div>
        <div className="space-card-status">
          <Skeleton />
        </div>
      </div>
    </CWCard>
  );
};
