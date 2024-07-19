import type { SnapshotProposal } from 'helpers/snapshot_utils';
import React from 'react';
import smartTruncate from 'smart-truncate';
import { CWCheck } from 'views/components/component_kit/cw_icons/cw_icons';
import { CWText } from '../component_kit/cw_text';
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
        <CWText fontWeight="medium" truncate title={snapshot.title}>
          {snapshot.title}
        </CWText>
        <CWText type="caption" title={snapshot.id}>
          Hash: {smartTruncate(snapshot.id, 12, { position: 4 })}
        </CWText>
      </div>
    </div>
  );
};

export { SnapshotProposalSelectorItem };
