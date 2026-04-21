import { ChainBase } from '@hicommonwealth/shared';
import React, { useState } from 'react';
import app from 'state';
import type Thread from '../../../models/Thread';
import { ProposalState } from '../../components/NewThreadForm/types';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { UpdateProposalStatusModal } from '../../modals/update_proposal_status_modal';
import './linked_proposals_card.scss';

type LinkedProposalsCardProps = {
  showAddProposalButton: boolean;
  thread: Thread | null;
  actionOnly?: boolean;
  actionLabel?: string;
  setLinkedProposals?: React.Dispatch<
    React.SetStateAction<ProposalState | null>
  >; // State setter for proposals
  linkedProposals?: ProposalState | null;
};

export const LinkedProposalsCard = ({
  thread,
  showAddProposalButton,
  actionOnly = false,
  actionLabel = 'Link proposal',
  setLinkedProposals,
  linkedProposals,
}: LinkedProposalsCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (
    app.chain?.meta.base !== ChainBase.Ethereum &&
    app.chain?.meta.base !== ChainBase.CosmosSDK
  ) {
    return <></>;
  }

  return (
    <>
      {!actionOnly && (
        <div className="LinkedProposalsCard">
          <CWText type="h4" className="LinkedProposalsCard-title">
            Link a Proposal
          </CWText>
          <CWText type="b2" className="no-proposals-text">
            Use the action below to manage linked proposals.
          </CWText>

          {showAddProposalButton && (
            <CWButton
              buttonHeight="sm"
              label={actionLabel}
              onClick={(e) => {
                e.preventDefault();
                setIsModalOpen(true);
              }}
            />
          )}
        </div>
      )}
      {actionOnly && showAddProposalButton && (
        <CWButton
          buttonHeight="sm"
          label={actionLabel}
          onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
        />
      )}
      <CWModal
        className="LinkedProposalsCardModal"
        size="medium"
        content={
          <UpdateProposalStatusModal
            thread={thread ? thread : null}
            onModalClose={() => setIsModalOpen(false)}
            snapshotProposalConnected={false}
            initialSnapshotLinks={[]}
            setLinkedProposals={setLinkedProposals}
            linkedProposals={linkedProposals}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
