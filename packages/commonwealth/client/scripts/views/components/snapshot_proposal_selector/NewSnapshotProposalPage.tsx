import React from 'react';
import { NewSnapshotProposalForm } from '../../../views/pages/new_snapshot_proposal/index';
import { CWText } from '../../components/component_kit/cw_text';

type NewSnapshotProposalPageProps = {
  snapshotId: string;
};

const NewSnapshotProposalPage = ({
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
