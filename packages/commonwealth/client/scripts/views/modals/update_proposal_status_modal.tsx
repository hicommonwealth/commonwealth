/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'modals/update_proposal_status_modal.scss';

import app from 'state';
import { threadStageToLabel, parseCustomStages } from 'helpers';
import { ChainEntity, Thread, ThreadStage } from 'models';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import { ChainEntitiesSelector } from '../components/chain_entities_selector';
import { CWButton } from '../components/component_kit/cw_button';
import { SnapshotProposalSelector } from '../components/snapshot_proposal_selector';
import { ModalExitButton } from '../components/component_kit/cw_modal';

type UpdateProposalStatusModalAttrs = {
  onChangeHandler: (
    stage: ThreadStage,
    chainEntities?: ChainEntity[],
    snapshotProposal?: SnapshotProposal[]
  ) => void;
  thread: Thread;
};

export class UpdateProposalStatusModal
  implements m.ClassComponent<UpdateProposalStatusModalAttrs>
{
  private chainEntitiesToSet: ChainEntity[];
  private snapshotProposalsToSet: SnapshotProposal[];
  private stage: ThreadStage;

  oninit(vnode) {
    this.stage = vnode.attrs.thread.stage;

    this.chainEntitiesToSet = [];
    this.snapshotProposalsToSet = [];
    vnode.attrs.thread.chainEntities.forEach((ce) =>
      this.chainEntitiesToSet.push(ce)
    );
  }

  view(vnode) {
    if (!app.chain?.meta) return;

    const { customStages } = app.chain?.meta;

    const stages = !customStages
      ? [
          ThreadStage.Discussion,
          ThreadStage.ProposalInReview,
          ThreadStage.Voting,
          ThreadStage.Passed,
          ThreadStage.Failed,
        ]
      : parseCustomStages(customStages);

    return (
      <div class="UpdateProposalStatusModal">
        <div class="compact-modal-title">
          <h3>Update proposal status</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body">
          {stages.length > 0 && (
            <div class="stage-options">
              {stages.map((targetStage) => (
                <CWButton
                  iconLeft={this.stage === targetStage ? 'check' : ''}
                  label={threadStageToLabel(targetStage)}
                  onclick={() => {
                    this.stage = targetStage;
                  }}
                />
              ))}
            </div>
          )}
          {app.chain?.meta?.snapshot && (
            <SnapshotProposalSelector
              thread={vnode.attrs.thread}
              onSelect={(sn) => {
                if (
                  this.stage === ThreadStage.Discussion ||
                  this.stage === ThreadStage.ProposalInReview
                ) {
                  this.stage = ThreadStage.Voting;
                }
                if (sn.id === vnode.attrs.thread.snapshotProposal) {
                  this.snapshotProposalsToSet = [];
                  vnode.attrs.thread.snapshotProposal = '';
                } else {
                  this.snapshotProposalsToSet = [sn];
                  vnode.attrs.thread.snapshotProposal = sn.id;
                }
              }}
              snapshotProposalsToSet={this.snapshotProposalsToSet}
            />
          )}
          {app.chain.chainEntities && (
            <ChainEntitiesSelector
              thread={vnode.attrs.thread}
              onSelect={() => {
                if (
                  this.stage === ThreadStage.Discussion ||
                  this.stage === ThreadStage.ProposalInReview
                ) {
                  this.stage = ThreadStage.Voting;
                }
              }}
              chainEntitiesToSet={this.chainEntitiesToSet}
            />
          )}
          <div class="buttons-row">
            <CWButton
              label="Cancel"
              buttonType="secondary-blue"
              onclick={(e) => {
                $(e.target).trigger('modalexit');
              }}
            />
            <CWButton
              label="Save changes"
              onclick={async (e) => {
                const { thread } = vnode.attrs;
                // set stage
                try {
                  await app.threads.setStage({
                    threadId: thread.id,
                    stage: this.stage,
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
                    entities: this.chainEntitiesToSet,
                  });
                  await app.threads.setLinkedSnapshotProposal({
                    threadId: thread.id,
                    snapshotProposal: this.snapshotProposalsToSet[0]?.id,
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
                vnode.attrs.onChangeHandler(
                  this.stage,
                  this.chainEntitiesToSet,
                  this.snapshotProposalsToSet
                );

                $(e.target).trigger('modalexit');
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}
