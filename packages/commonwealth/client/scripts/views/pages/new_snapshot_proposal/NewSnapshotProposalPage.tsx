import React, { useEffect, useState } from 'react';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import SnapshotSpaceSelectorModal from './SnapshotSpaceSelectorModal';
import { NewSnapshotProposalForm } from './index';

type NewSnapshotProposalPageProps = {
  snapshotId: string;
};

export const NewSnapshotProposalPage = ({
  snapshotId,
}: NewSnapshotProposalPageProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snapshotSpace, setSnapshotSpace] = useState('');

  const snapshotSpacesArray = snapshotId.split(',');

  useEffect(() => {
    if (snapshotSpacesArray.length > 1) {
      setIsModalOpen(true);
    } else {
      setSnapshotSpace(snapshotId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId]);

  const handleSpaceSelection = (space: string) => {
    setSnapshotSpace(space);
    setIsModalOpen(false);
  };

  return (
    <CWPageLayout>
      <div className="NewSnapshotProposalPage">
        <CWText type="h3" fontWeight="medium">
          New Snapshot Proposal
        </CWText>
        {snapshotSpace && (
          <NewSnapshotProposalForm snapshotId={snapshotSpace} />
        )}
      </div>
      <CWModal
        size="small"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={
          <div>
            <SnapshotSpaceSelectorModal
              snapshotSpacesArray={snapshotSpacesArray}
              onModalClose={() => setIsModalOpen(false)}
              handleSpaceSelection={handleSpaceSelection}
            />
          </div>
        }
      />
    </CWPageLayout>
  );
};

export default NewSnapshotProposalPage;
