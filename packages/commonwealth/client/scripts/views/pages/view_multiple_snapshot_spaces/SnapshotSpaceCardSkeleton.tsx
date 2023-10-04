import 'pages/snapshot/SnapshotSpaceCard.scss';
import React from 'react';
import { Skeleton } from '../../components/Skeleton';
import { CWCard } from '../../components/component_kit/cw_card';

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
