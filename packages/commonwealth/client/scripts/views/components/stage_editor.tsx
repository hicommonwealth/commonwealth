/* @jsx m */

import m from 'mithril';
import { Button, Classes, Dialog, Icons } from 'construct-ui';

import 'components/stage_editor.scss';

import app from 'state';
import { threadStageToLabel, parseCustomStages } from 'helpers';
import { ChainEntity, Thread, ThreadStage } from 'models';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import { SnapshotProposalSelector } from './snapshot_proposal_selector';
import { ChainEntitiesSelector } from './chain_entities_selector';

type StageEditorAttrs = {
  onChangeHandler: () => void;
  openStateHandler: () => void;
  popoverMenu?: boolean;
  thread: Thread;
};

export class StageEditor implements m.ClassComponent<StageEditorAttrs> {
  private chainEntitiesToSet: ChainEntity[];
  private isOpen: boolean;
  private snapshotProposalsToSet: SnapshotProposal[];
  private stage: ThreadStage;

  oninit(vnode) {
    this.isOpen = !!vnode.attrs.popoverMenu;
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
      <div class="StageEditor">
        {!vnode.attrs.popoverMenu && (
          <a
            href="#"
            onclick={(e) => {
              e.preventDefault();
              this.isOpen = true;
            }}
          >
            Edit stage
          </a>
        )}
        <Dialog
          basic={false}
          closeOnEscapeKey={true}
          closeOnOutsideClick={true}
          class="StageEditorDialog"
          content={[
            <div class="stage-options">
              {stages.map((targetStage) => (
                <Button
                  class="discussions-stage"
                  active={this.stage === targetStage}
                  iconLeft={this.stage === targetStage ? Icons.CHECK : null}
                  rounded={true}
                  size="sm"
                  label={threadStageToLabel(targetStage)}
                  onclick={() => {
                    this.stage = targetStage;
                  }}
                />
              ))}
            </div>,
            app.chain?.meta?.snapshot && (
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
            ),
            app.chain.chainEntities && (
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
            ),
          ]}
          hasBackdrop={true}
          isOpen={vnode.attrs.popoverMenu ? true : this.isOpen}
          inline={false}
          onClose={() => {
            if (vnode.attrs.popoverMenu) {
              vnode.attrs.openStateHandler(false);
            } else {
              this.isOpen = false;
            }
          }}
          title="Update proposal status"
          transitionDuration={200}
          footer={
            <div class={Classes.ALIGN_RIGHT}>
              <Button
                label="Cancel"
                rounded={true}
                onclick={() => {
                  if (vnode.attrs.popoverMenu) {
                    vnode.attrs.openStateHandler(false);
                  } else {
                    this.isOpen = false;
                  }
                }}
              />
              <Button
                label="Save changes"
                intent="primary"
                rounded={true}
                onclick={async () => {
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

                  if (vnode.attrs.popoverMenu) {
                    vnode.attrs.openStateHandler(false);
                  } else {
                    this.isOpen = false;
                  }
                }}
              />
            </div>
          }
        />
      </div>
    );
  }
}
