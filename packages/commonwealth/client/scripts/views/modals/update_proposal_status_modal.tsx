import React, { useState } from 'react';

import { parseCustomStages, threadStageToLabel } from 'helpers';
import {
  getProposal,
  getSpace,
  loadMultipleSpacesData,
  SnapshotProposal,
} from 'helpers/snapshot_utils';

import 'modals/update_proposal_status_modal.scss';
import type ChainEntity from '../../models/ChainEntity';
import type Thread from '../../models/Thread';
import { ThreadStage } from '../../models/types';
import { SelectList } from '../components/component_kit/cw_select_list';

import app from 'state';
import { ChainEntitiesSelector } from '../components/ChainEntitiesSelector';
import { CWButton } from '../components/component_kit/cw_button';
import { SnapshotProposalSelector } from '../components/snapshot_proposal_selector';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { Link, LinkSource } from 'models/Thread';
import { filterLinks, getAddedAndDeleted } from 'helpers/threads';
import { CosmosProposalSelector } from '../components/CosmosProposalSelector';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { ChainBase } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';

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

  const [tempStage, setTempStage] = useState(
    stages.includes(thread.stage) ? thread.stage : null
  );
  const [tempSnapshotProposals, setTempSnapshotProposals] = useState<
    Array<Pick<SnapshotProposal, 'id' | 'title'>>
  >(getInitialSnapshots(thread));
  const [tempProposals, setTempProposals] = useState<
    Array<Pick<ChainEntity, 'typeId'>>
  >(getInitialProposals(thread));
  const [tempCosmosProposals, setTempCosmosProposals] = useState<
    Array<Pick<CosmosProposal, 'identifier' | 'title'>>
  >(getInitialCosmosProposals(thread));

  const showSnapshot = !!app.chain.meta.snapshot?.length;
  const isCosmos = app.chain.base === ChainBase.CosmosSDK;
  const showChainEvents =
    !isCosmos && app.chainEntities.store.get(thread.chain)?.length > 0;

  const handleSaveChanges = async () => {
    // set stage
    try {
      await app.threads.setStage({
        threadId: thread.id,
        stage: tempStage,
      });
    } catch (err) {
      notifyError(`Failed to update stage. Make sure one is selected.`);
      throw new Error('Failed to update stage');
    }

    let links: Link[] = thread.links;

    try {
      const { toAdd, toDelete } = getAddedAndDeleted(
        tempSnapshotProposals,
        getInitialSnapshots(thread)
      );

      if (toAdd.length > 0) {
        let enrichedSnapshot;
        if (app.chain.meta.snapshot?.length === 1) {
          enrichedSnapshot = toAdd.map((sn) => ({
            id: `${app.chain.meta.snapshot[0]}/${sn.id}`,
            title: sn.title,
          }));
        } else {
          loadMultipleSpacesData(app.chain.meta.snapshot).then((data) => {
            for (const { space: _space, proposals } of data) {
              const matchingSnapshot = proposals.find(
                (sn) => sn.id === toAdd[0].id
              );
              if (matchingSnapshot) {
                enrichedSnapshot = {
                  id: `${_space.id}/${toAdd[0].id}`,
                };
                break;
              }
            }
          });
        }
        const updatedThread = await app.threads.addLinks({
          threadId: thread.id,
          links: enrichedSnapshot.map((sn) => ({
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
          links: toAdd.map(({ identifier, title }) => ({
            source: LinkSource.Proposal,
            identifier: identifier,
            title: title,
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

  const handleSelectCosmosProposal = (proposal: {
    identifier: string;
    title: string;
  }) => {
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
          placeholder="Select a stage"
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
          <CosmosProposalSelector
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
