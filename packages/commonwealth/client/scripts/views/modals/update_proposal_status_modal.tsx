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
import { ProposalSelector } from '../components/cosmos_proposal_selector';
import { CosmosProposal } from '/controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import CosmosChain from 'controllers/chain/cosmos/chain';

const getInitialSnapshots = (thread: Thread) =>
  filterLinks(thread.links, LinkSource.Snapshot).map((l) => ({
    id: l.identifier,
    title: l.title,
  }));

const getInitialProposals = (thread: Thread) =>
  filterLinks(thread.links, LinkSource.Proposal).map((l) => ({
    typeId: l.identifier,
    title: l.title,
  }));

const getInitialCosmosProposals = (thread: Thread) =>
  filterLinks(thread.links, LinkSource.Proposal).map((l) => ({
    identifier: l.identifier,
    title: l.title,
  }));

type UpdateProposalStatusModalProps = {
  onChangeHandler?: (stage: ThreadStage, links?: Link[]) => void;
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
    Array<Pick<SnapshotProposal, 'id' | 'title'>>
  >(getInitialSnapshots(thread));
  const [tempProposals, setTempProposals] = useState<
    Array<Pick<ChainEntity, 'typeId' | 'title'>>
  >(getInitialProposals(thread));
  const [tempCosmosProposals, setTempCosmosProposals] = useState<
    Array<Pick<CosmosProposal, 'identifier'>>
  >(getInitialCosmosProposals(thread));

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
  const isCosmos = app.chain?.chain instanceof CosmosChain;
  const showChainEvents =
    !isCosmos && app.chainEntities.store.get(thread.chain).length > 0;

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
            title: sn.title,
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

    try {
      const { toAdd, toDelete } = getAddedAndDeleted(
        tempCosmosProposals,
        getInitialCosmosProposals(thread),
        'identifier'
      );

      if (toAdd.length > 0) {
        const updatedThread = await app.threads.addLinks({
          threadId: thread.id,
          links: toAdd.map(({ identifier }) => ({
            source: LinkSource.Proposal,
            identifier: identifier,
          })),
        });

        links = updatedThread.links;
      }

      if (toDelete.length > 0) {
        const updatedThread = await app.threads.deleteLinks({
          threadId: thread.id,
          links: toDelete.map(({ identifier }) => ({
            source: LinkSource.Proposal,
            identifier: String(identifier),
          })),
        });

        links = updatedThread.links;
      }
    } catch (err) {
      console.log(err);
      throw new Error('Failed to update linked proposals');
    }

    onChangeHandler?.(tempStage, links);
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

    setTempSnapshotProposals(
      isSelected ? [] : [{ id: sn.id, title: sn.title }]
    );
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

  const handleSelectCosmosProposal = (proposal: { identifier: string }) => {
    const isSelected = tempCosmosProposals.find(
      ({ identifier }) => proposal.identifier === String(identifier)
    );
    const updatedProposals = isSelected
      ? tempCosmosProposals.filter(
          ({ identifier }) => proposal.identifier !== String(identifier)
        )
      : [...tempCosmosProposals, proposal];
    setTempCosmosProposals(updatedProposals);
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
        {showChainEvents && (
          <ChainEntitiesSelector
            onSelect={handleSelectChainEntity}
            proposalsToSet={tempProposals}
          />
        )}
        {isCosmos && (
          <ProposalSelector
            onSelect={handleSelectCosmosProposal}
            proposalsToSet={tempCosmosProposals}
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
