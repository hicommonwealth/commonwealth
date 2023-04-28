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
import { Link, LinkSource } from 'models/Thread';
import { filterLinks, getAddedAndDeleted } from 'helpers/threads';

const getInitialSnapshots = (thread: Thread) =>
  filterLinks(thread.links, LinkSource.Snapshot).map((l) => ({
    id: l.identifier,
  }));

const getInitialProposals = (thread: Thread) =>
  filterLinks(thread.links, LinkSource.Proposal).map((l) => ({
    typeId: l.identifier,
  }));

type UpdateProposalStatusModalProps = {
  onChangeHandler: (stage: ThreadStage, links?: Link[]) => void;
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
    Array<Pick<SnapshotProposal, 'id'>>
  >(getInitialSnapshots(thread));
  const [tempProposals, setTempProposals] = useState<
    Array<Pick<ChainEntity, 'typeId'>>
  >(getInitialProposals(thread));

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

    let links: Link[] = thread.links;

    try {
      const { toAdd, toDelete } = getAddedAndDeleted(
        tempSnapshotProposals,
        getInitialSnapshots(thread)
      );

      if (toAdd.length > 0) {
        const updatedThread = await app.threads.addLinks({
          threadId: thread.id,
          links: toAdd.map((sn) => ({
            source: LinkSource.Snapshot,
            identifier: String(sn.id),
          })),
        });

        links = updatedThread.links;
      }

      if (toDelete.length > 0) {
        const updatedThread = await app.threads.deleteLinks({
          threadId: thread.id,
          links: toDelete.map((sn) => ({
            source: LinkSource.Snapshot,
            identifier: String(sn.id),
          })),
        });

        links = updatedThread.links;
      }
    } catch (err) {
      console.log(err);
      throw new Error('Failed to update proposal links');
    }

    try {
      const { toAdd, toDelete } = getAddedAndDeleted(
        tempProposals,
        getInitialProposals(thread),
        'typeId'
      );

      if (toAdd.length > 0) {
        const updatedThread = await app.threads.addLinks({
          threadId: thread.id,
          links: toAdd.map(({ typeId }) => ({
            source: LinkSource.Proposal,
            identifier: String(typeId),
          })),
        });

        links = updatedThread.links;
      }

      if (toDelete.length > 0) {
        const updatedThread = await app.threads.deleteLinks({
          threadId: thread.id,
          links: toDelete.map(({ typeId }) => ({
            source: LinkSource.Proposal,
            identifier: String(typeId),
          })),
        });

        links = updatedThread.links;
      }
    } catch (err) {
      console.log(err);
      throw new Error('Failed to update linked proposals');
    }

    onChangeHandler(tempStage, links);
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

    setTempSnapshotProposals(isSelected ? [] : [{ id: sn.id }]);
    setVotingStage();
  };

  const handleSelectChainEntity = (ce: { typeId: string }) => {
    const isSelected = tempProposals.find(
      ({ typeId }) => ce.typeId === String(typeId)
    );

    const updatedChainEntities = isSelected
      ? tempProposals.filter(({ typeId }) => ce.typeId !== String(typeId))
      : [...tempProposals, ce];

    setTempProposals(updatedChainEntities);
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
            proposalsToSet={tempProposals}
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
