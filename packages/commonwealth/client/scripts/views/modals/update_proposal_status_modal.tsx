import React, { useState } from 'react';

import { parseCustomStages, threadStageToLabel } from 'helpers';
import type { SnapshotProposal } from 'helpers/snapshot_utils';

import 'modals/update_proposal_status_modal.scss';
import type { ChainEntity, Thread } from 'models';
import { ThreadStage } from 'models';
import { SelectList } from '../components/component_kit/cw_select_list';

import app from 'state';
import { ChainEntitiesSelector } from '../components/chain_entities_selector';
import { CWButton } from '../components/component_kit/cw_button';
import { SnapshotProposalSelector } from '../components/snapshot_proposal_selector';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type UpdateProposalStatusModalProps = {
  onChangeHandler: (
    stage: ThreadStage,
    chainEntities?: ChainEntity[],
    snapshotProposal?: SnapshotProposal[]
  ) => void;
  onModalClose: () => void;
  thread: Thread;
};

export const UpdateProposalStatusModal = ({
  onChangeHandler,
  onModalClose,
  thread,
}: UpdateProposalStatusModalProps) => {
  const [tempStage, setTempStage] = useState<ThreadStage>(thread.stage);
  const [tempSnapshotProposals, setTempSnapshotProposals] = useState<
    Array<SnapshotProposal>
  >([{ id: thread.snapshotProposal } as SnapshotProposal]);
  const [tempChainEntities, setTempChainEntities] = useState<
    Array<ChainEntity>
  >(thread.chainEntities || []);

  if (!app.chain?.meta) {
    return;
  }

  const { customStages } = app.chain.meta;

  const stages = !customStages
    ? [
        ThreadStage.Discussion,
        ThreadStage.ProposalInReview,
        ThreadStage.Voting,
        ThreadStage.Passed,
        ThreadStage.Failed,
      ]
    : parseCustomStages(customStages);
  const showSnapshot = !!app.chain.meta.snapshot?.length;

  const handleSaveChanges = async () => {
    // set stage
    try {
      await app.threads.setStage({
        threadId: thread.id,
        stage: tempStage,
      });
    } catch (err) {
      console.log('Failed to update stage');
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? `${err.responseJSON.error}. Make sure one is selected.`
          : 'Failed to update stage, make sure one is selected'
      );
    }

    // set linked chain entities
    try {
      await app.threads.setLinkedChainEntities({
        threadId: thread.id,
        entities: tempChainEntities,
      });
      await app.threads.setLinkedSnapshotProposal({
        threadId: thread.id,
        snapshotProposal: tempSnapshotProposals[0]?.id,
      });
    } catch (err) {
      console.log('Failed to update linked proposals');
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to update linked proposals'
      );
    }

    onChangeHandler(tempStage, tempChainEntities, tempSnapshotProposals);
    onModalClose();
  };

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

    setTempSnapshotProposals(isSelected ? [] : [sn]);
    setVotingStage();
  };

  const handleSelectChainEntity = (ce: ChainEntity) => {
    const isSelected = tempChainEntities.find(({ id }) => ce.id === id);

    const updatedChainEntities = isSelected
      ? tempChainEntities.filter(({ id }) => ce.id !== id)
      : [...tempChainEntities, ce];

    setTempChainEntities(updatedChainEntities);
    setVotingStage();
  };

  return (
    <div className="UpdateProposalStatusModal">
      <div className="compact-modal-title">
        <h3>Update proposal status</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        <SelectList
          defaultValue={
            tempStage
              ? { value: tempStage, label: threadStageToLabel(tempStage) }
              : null
          }
          placeholder="Select the stage"
          isSearchable={false}
          options={stages.map((stage) => ({
            value: stage,
            label: threadStageToLabel(stage),
          }))}
          className="StageSelector"
          onChange={(option) => setTempStage(option.value)}
        />
        {showSnapshot && (
          <SnapshotProposalSelector
            onSelect={handleSelectProposal}
            snapshotProposalsToSet={tempSnapshotProposals}
          />
        )}
        {app.chainEntities && (
          <ChainEntitiesSelector
            onSelect={handleSelectChainEntity}
            chainEntitiesToSet={tempChainEntities}
          />
        )}
        <div className="buttons-row">
          <CWButton
            label="Cancel"
            buttonType="secondary-blue"
            onClick={onModalClose}
          />
          <CWButton label="Save changes" onClick={handleSaveChanges} />
        </div>
      </div>
    </div>
  );
};
