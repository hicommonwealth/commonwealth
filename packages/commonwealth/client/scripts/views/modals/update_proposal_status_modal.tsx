import React from 'react';

import type Thread from '../../models/Thread';

import { Link } from 'models/Thread';
import { ProposalState } from '../components/NewThreadFormModern/NewThreadForm';
import { NoThreadUpdateProposalStatusModal } from './NoThreadUpdateProposalStatusModal';
import { ThreadUpdateProposalStatusModal } from './ThreadUpdateProposalStatusModal';
import './UpdateProposalStatusModal.scss';

type UpdateProposalStatusModalProps = {
  onChangeHandler?: (stage: string, links?: Link[]) => void;
  onModalClose: () => void;
  thread: Thread | null;
  snapshotProposalConnected?: boolean;
  initialSnapshotLinks?: Link[];
  setLinkedProposals?: React.Dispatch<React.SetStateAction<ProposalState>>; // State setter for proposals
  linkedProposals?: ProposalState | null;
};

export const UpdateProposalStatusModal = ({
  onChangeHandler,
  onModalClose,
  thread,
  snapshotProposalConnected,
  initialSnapshotLinks,
  setLinkedProposals,
  linkedProposals,
}: UpdateProposalStatusModalProps) => {
  return thread ? (
    <ThreadUpdateProposalStatusModal
      onChangeHandler={onChangeHandler}
      onModalClose={onModalClose}
      thread={thread}
      snapshotProposalConnected={snapshotProposalConnected}
      initialSnapshotLinks={initialSnapshotLinks}
    />
  ) : (
    <NoThreadUpdateProposalStatusModal
      onModalClose={onModalClose}
      setLinkedProposals={setLinkedProposals}
      linkedProposals={linkedProposals}
    />
  );
};
