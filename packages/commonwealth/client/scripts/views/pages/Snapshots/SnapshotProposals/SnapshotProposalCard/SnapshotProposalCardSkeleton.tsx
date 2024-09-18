import React from 'react';

import { CWCard } from 'views/components/component_kit/cw_card';
import { Skeleton } from 'views/components/Skeleton';

import './SnapshotProposalCard.scss';

export const SnapshotProposalCardSkeleton = () => {
  return (
    <CWCard elevation="elevation-2" interactive={true} className="ProposalCard">
      <div className="proposal-card-metadata">
        <Skeleton width="90%" />
        <Skeleton width="100%" />
        <Skeleton width="90%" />
      </div>
    </CWCard>
  );
};
