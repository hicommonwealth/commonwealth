import React, { useState } from 'react';

import { parseCustomStages, threadStageToLabel } from 'helpers';
import type { SnapshotProposal } from 'helpers/snapshot_utils';

import 'modals/update_proposal_status_modal.scss';
import type { ChainEntity, Thread } from 'models';
import { ThreadStage } from 'models';

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
  const [snapshotProposalsToSet, setSnapshotProposalsToSet] = useState<
    Array<SnapshotProposal>
  >([]);
  const [stage, setStage] = useState<ThreadStage>(thread.stage);

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

  return (
    <div className="UpdateProposalStatusModal">
      <div className="compact-modal-title">
        <h3>Update proposal status</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        {stages.length > 0 && (
          <div className="stage-options">
            {stages.map((targetStage) => (
              <CWButton
                iconLeft={stage === targetStage ? 'check' : undefined}
                label={threadStageToLabel(targetStage)}
                onClick={() => {
                  setStage(targetStage);
                }}
              />
            ))}
          </div>
        )}
        {showSnapshot && (
          <SnapshotProposalSelector
            thread={thread}
            onSelect={(sn) => {
              if (
                stage === ThreadStage.Discussion ||
                stage === ThreadStage.ProposalInReview
              ) {
                setStage(ThreadStage.Voting);
              }
              if (sn.id === thread.snapshotProposal) {
                setSnapshotProposalsToSet([]);
                thread.snapshotProposal = '';
              } else {
                setSnapshotProposalsToSet([sn]);
                thread.snapshotProposal = sn.id;
              }
            }}
            snapshotProposalsToSet={snapshotProposalsToSet}
          />
        )}
        {app.chainEntities && (
          <ChainEntitiesSelector
            thread={thread}
            onSelect={() => {
              if (
                stage === ThreadStage.Discussion ||
                stage === ThreadStage.ProposalInReview
              ) {
                setStage(ThreadStage.Voting);
              }
            }}
            chainEntitiesToSet={thread.chainEntities}
          />
        )}
        <div className="buttons-row">
          <CWButton
            label="Cancel"
            buttonType="secondary-blue"
            onClick={() => {
              onModalClose();
            }}
          />
          <CWButton
            label="Save changes"
            onClick={async () => {
              // set stage
              try {
                await app.threads.setStage({
                  threadId: thread.id,
                  stage,
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
                  entities: thread.chainEntities,
                });
                await app.threads.setLinkedSnapshotProposal({
                  threadId: thread.id,
                  snapshotProposal: snapshotProposalsToSet[0]?.id,
                });
              } catch (err) {
                console.log('Failed to update linked proposals');
                throw new Error(
                  err.responseJSON && err.responseJSON.error
                    ? err.responseJSON.error
                    : 'Failed to update linked proposals'
                );
              }

              // TODO: add set linked snapshot proposals
              onChangeHandler(stage);
              onModalClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
