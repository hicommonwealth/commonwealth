import { CWCheck } from 'views/components/component_kit/cw_icons/cw_icons';
import React from 'react';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import { CWText } from '../component_kit/cw_text';
import smartTruncate from 'smart-truncate';
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
        <CWText fontWeight="medium" title={snapshot.title}>
          {snapshot.title}
        </CWText>
        <CWText type="caption" title={snapshot.id}>
          Hash: {smartTruncate(snapshot.id, 8, {position: 5})}
        </CWText>
    </div>
  );
};

export { SnapshotProposalSelectorItem };
