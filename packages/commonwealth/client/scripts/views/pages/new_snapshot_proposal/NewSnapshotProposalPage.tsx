import React from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { NewSnapshotProposalForm } from './index';

type NewSnapshotProposalPageProps = {
  snapshotId: string;
};

export const NewSnapshotProposalPage = ({
  snapshotId,
}: NewSnapshotProposalPageProps) => {
  return (
    <div className="NewSnapshotProposalPage">
      <CWText type="h3" fontWeight="medium">
        New Snapshot Proposal
      </CWText>
      <NewSnapshotProposalForm snapshotId={snapshotId} />
    </div>
  );
};

export default NewSnapshotProposalPage;
