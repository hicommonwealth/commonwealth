import { ChainBase } from '@hicommonwealth/shared';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import React, { useRef } from 'react';
import app from 'state';
import { parseCustomStages, threadStageToLabel } from '../../helpers';
import { ThreadStage } from '../../models/types';
import { SelectList } from '../components/component_kit/cw_select_list';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { CosmosProposalSelector } from '../components/CosmosProposalSelector';
import { SnapshotProposalSelector } from '../components/snapshot_proposal_selector';
import './UpdateProposalStatusModal.scss';

type ProposalStatusModalContentProps = {
  onModalClose: () => void;
  showRemoveButton?: boolean;
  onRemoveProposal?: () => void;
  onSaveChanges: () => void;
  tempStage: string | null;
  setTempStage: React.Dispatch<React.SetStateAction<string | null>>;
  tempSnapshotProposals: Array<Pick<SnapshotProposal, 'id' | 'title'>>;
  setTempSnapshotProposals: React.Dispatch<
    React.SetStateAction<Array<Pick<SnapshotProposal, 'id' | 'title'>>>
  >;
  tempCosmosProposals: Array<Pick<CosmosProposal, 'identifier' | 'title'>>;
  setTempCosmosProposals: React.Dispatch<
    React.SetStateAction<Array<Pick<CosmosProposal, 'identifier' | 'title'>>>
  >;
  onSelectSnapshotProposal?: (sn: SnapshotProposal) => void;
  onSelectCosmosProposal?: (proposal: {
    identifier: string;
    title: string;
  }) => void;
};

export const ProposalStatusModalContent = ({
  onModalClose,
  showRemoveButton = false,
  onRemoveProposal,
  onSaveChanges,
  tempStage,
  setTempStage,
  tempSnapshotProposals,
  setTempSnapshotProposals,
  tempCosmosProposals,
  setTempCosmosProposals,
}: ProposalStatusModalContentProps) => {
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const { custom_stages } = app.chain.meta;
  const stages = parseCustomStages(custom_stages);
  const showSnapshot = !!app.chain.meta?.snapshot_spaces?.length;
  const isCosmos = app.chain.base === ChainBase.CosmosSDK;

  const setVotingStage = () => {
    if (
      tempStage === ThreadStage.Discussion ||
      tempStage === ThreadStage.ProposalInReview
    ) {
      setTempStage(ThreadStage.Voting);
    }
  };

  const handleSelectProposal = (sn: SnapshotProposal) => {
    const isSelected = tempSnapshotProposals.find(({ id }) => sn.id === id);
    setTempSnapshotProposals(
      isSelected ? [] : [{ id: sn.id, title: sn.title }],
    );
    setVotingStage();
  };

  const handleSelectCosmosProposal = (proposal: {
    identifier: string;
    title: string;
  }) => {
    const isSelected = tempCosmosProposals.find(
      ({ identifier }) => proposal.identifier === String(identifier),
    );
    const updatedProposals = isSelected
      ? tempCosmosProposals.filter(
          ({ identifier }) => proposal.identifier !== String(identifier),
        )
      : [...tempCosmosProposals, proposal];
    setTempCosmosProposals(updatedProposals);
    setVotingStage();
  };

  return (
    <div className="UpdateProposalStatusModal" ref={modalContainerRef}>
      <CWModalHeader
        label="Update proposal status"
        onModalClose={onModalClose}
      />
      <CWModalBody allowOverflow>
        {showSnapshot ? (
          <>
            <SelectList
              defaultValue={
                tempStage
                  ? { value: tempStage, label: threadStageToLabel(tempStage) }
                  : null
              }
              placeholder="Select a stage"
              isSearchable={false}
              options={stages.map((stage) => ({
                value: stage as ThreadStage,
                label: threadStageToLabel(stage),
              }))}
              className="StageSelector"
              menuPortalTarget={modalContainerRef.current}
              // @ts-expect-error <StrictNullChecks/>
              onChange={(option) => setTempStage(option.value)}
            />
            <SnapshotProposalSelector
              onSelect={handleSelectProposal}
              snapshotProposalsToSet={tempSnapshotProposals}
            />
          </>
        ) : (
          !isCosmos && <CWText>Please connect your Snapshot space</CWText>
        )}
        {isCosmos && (
          <CosmosProposalSelector
            onSelect={handleSelectCosmosProposal}
            proposalsToSet={tempCosmosProposals}
          />
        )}
      </CWModalBody>
      <CWModalFooter>
        <div className="proposal-modal">
          <div className="left-button">
            {showRemoveButton && (
              <CWButton
                label="Remove proposal"
                buttonType="destructive"
                buttonHeight="sm"
                onClick={onRemoveProposal}
              />
            )}
          </div>
          <div className="right-buttons">
            <CWButton
              label="Cancel"
              buttonType="secondary"
              buttonHeight="sm"
              onClick={onModalClose}
            />
            <CWButton
              buttonType="primary"
              buttonHeight="sm"
              label="Save changes"
              onClick={onSaveChanges}
            />
          </div>
        </div>
      </CWModalFooter>
    </div>
  );
};
