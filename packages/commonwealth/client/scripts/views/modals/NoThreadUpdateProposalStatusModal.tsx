import { ChainBase } from '@hicommonwealth/shared';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import React, { useState } from 'react';
import app from 'state';
import { ProposalState } from '../components/NewThreadFormModern/NewThreadForm';
import { ProposalStatusModalContent } from './ProposalStatusModalContent';

type NoThreadUpdateProposalStatusModalProps = {
  onModalClose: () => void;
  setLinkedProposals?: React.Dispatch<
    React.SetStateAction<ProposalState | null>
  >;
  linkedProposals?: ProposalState | null;
};

export const NoThreadUpdateProposalStatusModal = ({
  onModalClose,
  setLinkedProposals,
  linkedProposals,
}: NoThreadUpdateProposalStatusModalProps) => {
  const [tempStage, setTempStage] = useState<string | null>(null);
  const [tempSnapshotProposals, setTempSnapshotProposals] = useState<
    Array<Pick<SnapshotProposal, 'id' | 'title'>>
  >(
    linkedProposals?.source === 'snapshot'
      ? [{ id: linkedProposals.proposalId, title: linkedProposals.title }]
      : [],
  );
  const [tempCosmosProposals, setTempCosmosProposals] = useState<
    Array<Pick<CosmosProposal, 'identifier' | 'title'>>
  >(
    linkedProposals?.source === 'proposal'
      ? [
          {
            identifier: linkedProposals.proposalId,
            title: linkedProposals.title,
          },
        ]
      : [],
  );
  const handleSaveChanges = () => {
    const showSnapshot = !!app.chain.meta?.snapshot_spaces?.length;
    const isCosmos = app.chain.base === ChainBase.CosmosSDK;

    if (showSnapshot && tempSnapshotProposals.length > 0) {
      const snapshotId = app.chain.meta.snapshot_spaces;
      if (snapshotId?.length === 1) {
        const proposalData = {
          identifier: `${snapshotId[0]}/${tempSnapshotProposals[0].id}`,
          source: 'snapshot',
          title: tempSnapshotProposals[0].title,
          proposalId: tempSnapshotProposals[0].id,
          snapshotIdentifier: snapshotId[0],
        } as ProposalState;
        setLinkedProposals?.(proposalData);
      }
    } else if (isCosmos && tempCosmosProposals.length > 0) {
      const proposalData = {
        identifier: tempCosmosProposals[0].identifier,
        source: 'proposal',
        title: tempCosmosProposals[0].title || 'Proposal',
        proposalId: tempCosmosProposals[0].identifier,
      } as ProposalState;
      setLinkedProposals?.(proposalData);
    } else {
      setLinkedProposals?.(null);
    }
    onModalClose();
  };
  return (
    <ProposalStatusModalContent
      onModalClose={onModalClose}
      onSaveChanges={handleSaveChanges}
      tempStage={tempStage}
      setTempStage={setTempStage}
      tempSnapshotProposals={tempSnapshotProposals}
      setTempSnapshotProposals={setTempSnapshotProposals}
      tempCosmosProposals={tempCosmosProposals}
      setTempCosmosProposals={setTempCosmosProposals}
    />
  );
};
