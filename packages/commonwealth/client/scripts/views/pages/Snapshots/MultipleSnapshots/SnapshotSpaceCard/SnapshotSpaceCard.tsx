import React from 'react';

import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { useCommonNavigate } from 'navigation/helpers';
import { CWCard } from 'views/components/component_kit/cw_card';

import { SnapshotSpaceCardSkeleton } from './SnapshotSpaceCardSkeleton';

import './SnapshotSpaceCard.scss';

function countActiveProposals(proposals: SnapshotProposal[]): number {
  return proposals.filter((proposal) => proposal.state === 'active').length;
}

type SnapshotSpaceCardProps = {
  proposals: SnapshotProposal[];
  space: SnapshotSpace;
  showSkeleton?: boolean;
};

export const SnapshotSpaceCard = (props: SnapshotSpaceCardProps) => {
  const { space, proposals, showSkeleton } = props;
  const navigate = useCommonNavigate();

  if (showSkeleton) return <SnapshotSpaceCardSkeleton />;

  if (!space || !proposals) return;

  const numActiveProposals = countActiveProposals(proposals);

  return (
    <CWCard
      elevation="elevation-2"
      interactive
      className="SnapshotSpaceCard"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        navigate(`/snapshot/${space.id}`);
      }}
    >
      <div className="space-card-container">
        <div className="space-card-metadata">
          <div className="space-card-title">{space.name}</div>
          <div className="space-card-subheader">{space.id}</div>
        </div>
        <div className="space-card-status">
          {`${numActiveProposals} Active Proposal${
            numActiveProposals === 1 ? '' : 's'
          }`}
        </div>
      </div>
    </CWCard>
  );
};
