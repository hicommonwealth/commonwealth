import 'components/ProposalCard/ProposalCard.scss';
import React from 'react';
import { Skeleton } from '../../components/Skeleton';
import { CWCard } from '../../components/component_kit/cw_card';

export const SnapshotProposalCardSkeleton = () => {
  return (
    <CWCard elevation="elevation-2" interactive={true} className="ProposalCard">
      <div className="proposal-card-metadata">
        <Skeleton width={'90%'} />
        <Skeleton width={'100%'} />
        <Skeleton width={'90%'} />
      </div>
    </CWCard>
  );
};
