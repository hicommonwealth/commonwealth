import React from 'react';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWText } from '../../components/component_kit/cw_text';
import { NewSnapshotProposalForm } from './index';

type NewSnapshotProposalPageProps = {
  snapshotId: string;
};

export const NewSnapshotProposalPage = ({
  snapshotId,
}: NewSnapshotProposalPageProps) => {
  return (
    <CWPageLayout>
      <div className="NewSnapshotProposalPage">
        <CWText type="h3" fontWeight="medium">
          New Snapshot Proposal
        </CWText>
        <NewSnapshotProposalForm snapshotId={snapshotId} />
      </div>
    </CWPageLayout>
  );
};

export default NewSnapshotProposalPage;
