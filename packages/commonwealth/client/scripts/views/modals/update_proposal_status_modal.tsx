import React, { useState } from 'react';

import type ChainEntity from '../../models/ChainEntity';
import type Thread from '../../models/Thread';
import { ChainBase } from 'common-common/src/types';
import app from '../../state';
import { parseCustomStages, threadStageToLabel } from '../../helpers';
import {
  SnapshotProposal,
  loadMultipleSpacesData,
} from '../../helpers/snapshot_utils';
import { ThreadStage } from '../../models/types';
import {
  useAddThreadLinksMutation,
  useDeleteThreadLinksMutation,
  useEditThreadMutation,
} from '../../state/api/threads';
import { notifyError } from '../../controllers/app/notifications';
import { CosmosProposal } from '../../controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { filterLinks, getAddedAndDeleted } from '../../helpers/threads';
import { Link, LinkSource } from '../../models/Thread';
import { SelectList } from '../components/component_kit/cw_select_list';
import { ChainEntitiesSelector } from '../components/ChainEntitiesSelector';
import { CosmosProposalSelector } from '../components/CosmosProposalSelector';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { SnapshotProposalSelector } from '../components/snapshot_proposal_selector';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';

import '../../../styles/modals/update_proposal_status_modal.scss';

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

  const { mutateAsync: editThread } = useEditThreadMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
    currentStage: thread.stage,
    currentTopicId: thread.topic.id,
  });

  const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
  });

  const { mutateAsync: deleteThreadLinks } = useDeleteThreadLinksMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
  });

  const handleSaveChanges = async () => {
    // set stage
    try {
      await editThread({
        address: app.user.activeAccount.address,
        chainId: app.activeChainId(),
        threadId: thread.id,
        stage: tempStage,
      });
    } catch (err) {
      const error =
        err?.responseJSON?.error ||
        'Failed to update stage. Make sure one is selected.';
      notifyError(error);
      throw new Error(error);
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
          enrichedSnapshot = {
            id: `${app.chain.meta.snapshot[0]}/${toAdd[0].id}`,
            title: toAdd[0].title,
          };
        } else {
          await loadMultipleSpacesData(app.chain.meta.snapshot).then((data) => {
            for (const { space: _space, proposals } of data) {
              const matchingSnapshot = proposals.find(
                (sn) => sn.id === toAdd[0].id
              );
              if (matchingSnapshot) {
                enrichedSnapshot = {
                  id: `${_space.id}/${toAdd[0].id}`,
                  title: toAdd[0].title,
                };
                break;
              }
            }
          });
        }
        const updatedThread = await addThreadLinks({
          chainId: app.activeChainId(),
          threadId: thread.id,
          links: [
            {
              source: LinkSource.Snapshot,
              identifier: String(enrichedSnapshot.id),
              title: enrichedSnapshot.title,
            },
          ],
        });

        links = updatedThread.links;
      }

      if (toDelete.length > 0) {
        const updatedThread = await deleteThreadLinks({
          chainId: app.activeChainId(),
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
        const updatedThread = await addThreadLinks({
          chainId: app.activeChainId(),
          threadId: thread.id,
          links: toAdd.map(({ typeId }) => ({
            source: LinkSource.Proposal,
            identifier: String(typeId),
          })),
        });

        links = updatedThread.links;
      }

      if (toDelete.length > 0) {
        const updatedThread = await deleteThreadLinks({
          chainId: app.activeChainId(),
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
        const updatedThread = await addThreadLinks({
          chainId: app.activeChainId(),
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
        const updatedThread = await deleteThreadLinks({
          chainId: app.activeChainId(),
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
      <CWModalHeader
        label="Update proposal status"
        onModalClose={onModalClose}
      />
      <CWModalBody unset>
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
      </CWModalBody>
      <CWModalFooter>
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
          onClick={handleSaveChanges}
        />
      </CWModalFooter>
    </div>
  );
};
