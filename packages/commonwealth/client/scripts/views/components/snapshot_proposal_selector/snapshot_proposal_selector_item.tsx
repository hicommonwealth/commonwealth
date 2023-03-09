import { CWCheck } from 'views/components/component_kit/cw_icons/cw_icons';
import React from 'react';
import type { SnapshotProposal } from 'helpers/snapshot_utils';

interface SnapshotProposalSelectorItemProps {
  snapshot: SnapshotProposal;
  isSelected: boolean;
  onClick: (snapshot: SnapshotProposal) => void;
}

const SnapshotProposalSelectorItem = ({
  onClick,
  snapshot,
  isSelected,
}: SnapshotProposalSelectorItemProps) => {
  return (
    <div className="proposal-item" onClick={() => onClick(snapshot)}>
      <div className="selected">{isSelected && <CWCheck />}</div>
      <div className="text">
        <div className="proposal-item-text" title={snapshot.title}>
          {snapshot.title}
        </div>
        <div className="proposal-item-subtext" title={snapshot.id}>
          Hash: ${snapshot.id}
        </div>
      </div>
    </div>
  );
};

export { SnapshotProposalSelectorItem };
