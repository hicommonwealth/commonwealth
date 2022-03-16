/* @jsx m */

import m from 'mithril';
import { uuidv4 } from 'lib/util';
import {
  QueryList,
  ListItem,
  Button,
  Classes,
  Dialog,
  Icons,
} from 'construct-ui';

import 'components/stage_editor.scss';

import app from 'state';
import { offchainThreadStageToLabel, parseCustomStages } from 'helpers';
import { ChainEntity, OffchainThread, OffchainThreadStage } from 'models';
import { chainEntityTypeToProposalName } from 'identifiers';
import { EntityRefreshOption } from 'controllers/server/chain_entities';
import {
  loadMultipleSpacesData,
  SnapshotProposal,
} from 'helpers/snapshot_utils';

type SnapshotProposalSelectorAttrs = {
  onSelect: () => void;
  snapshotProposalsToSet: SnapshotProposal[];
  thread: OffchainThread;
};

class SnapshotProposalSelector
  implements m.ClassComponent<SnapshotProposalSelectorAttrs>
{
  private all_proposals: SnapshotProposal[];
  private initialized: boolean;
  private snapshotProposalsLoaded: boolean;

  view(vnode) {
    const { onSelect } = vnode.attrs;

    if (!app.chain || !app.activeChainId()) return;

    if (!this.initialized) {
      this.all_proposals = [];
      this.initialized = true;

      loadMultipleSpacesData(app.chain.meta.chain.snapshot).then((data) => {
        for (const { proposals } of data) {
          this.all_proposals = [...this.all_proposals, ...proposals];
        }

        this.snapshotProposalsLoaded = true;
        m.redraw();
      });
    }

    return (
      <div class="ChainEntitiesSelector">
        {this.snapshotProposalsLoaded ? (
          <QueryList
            checkmark={true}
            items={this.all_proposals.sort((a, b) => {
              return b.created - a.created;
            })}
            inputAttrs={{
              placeholder: 'Search for an existing snapshot proposal...',
            }}
            itemRender={(sn: SnapshotProposal) => {
              const selected = sn.id === vnode.attrs.thread.snapshotProposal;
              // TODO: show additional info on the ListItem,
              // like any set proposal title, the creator, or other metadata
              return (
                <ListItem
                  label={
                    <div class="chain-entity-info">
                      <div class="chain-entity-top">
                        {sn.title.slice(0, 60)}...
                      </div>
                      <div class="chain-entity-bottom">Hash: ${sn.id}</div>
                    </div>
                  }
                  selected={selected}
                  key={sn.id}
                />
              );
            }}
            itemPredicate={(query, sn: SnapshotProposal) => {
              // TODO
              return sn.title
                ?.toString()
                .toLowerCase()
                .includes(query.toLowerCase());
            }}
            onSelect={(sn: SnapshotProposal) => {
              onSelect(sn);
            }}
          />
        ) : (
          <div class="chain-entities-selector-placeholder">
            <div class="chain-entities-selector-placeholder-text">
              {this.snapshotProposalsLoaded
                ? 'TODO: how to begin?'
                : 'Loading snapshot proposals...'}
            </div>
          </div>
        )}
      </div>
    );
  }
}

type ChainEntitiesSelectorAttrs = {
  chainEntitiesToSet: ChainEntity[];
  onSelect: () => void;
  thread: OffchainThread;
};

class ChainEntitiesSelector
  implements m.ClassComponent<ChainEntitiesSelectorAttrs>
{
  private chainEntitiesLoaded: boolean;
  private initialized: boolean;

  view(vnode) {
    const { thread, onSelect } = vnode.attrs;

    if (!app.chain || !app.activeChainId()) return;

    if (!this.initialized) {
      this.initialized = true;
      app.chain.chainEntities
        ?.refresh(app.chain.id, EntityRefreshOption.AllEntities)
        .then(() => {
          // refreshing loads the latest chain entities into app.chain.chainEntities store
          this.chainEntitiesLoaded = true;
          m.redraw();
        });
    }

    return (
      <div class="ChainEntitiesSelector">
        {this.chainEntitiesLoaded ? (
          <QueryList
            checkmark={true}
            items={app.chain.chainEntities.store.getAll().sort((a, b) => {
              if (!a.threadId && b.threadId) return -1;
              if (a.threadId && !b.threadId) return 1;
              return 0;
            })}
            inputAttrs={{
              placeholder: 'Search for an existing proposal...',
            }}
            itemRender={(ce: ChainEntity) => {
              const selected =
                vnode.attrs.chainEntitiesToSet
                  .map((ce_) => ce_.id)
                  .indexOf(ce.id) !== -1;
              // TODO: show additional info on the ListItem,
              // like any set proposal title, the creator, or other metadata
              return (
                <ListItem
                  disabled={ce.threadId && ce.threadId !== thread.id}
                  label={
                    <div class="chain-entity-info">
                      <div class="chain-entity-top">
                        {chainEntityTypeToProposalName(ce.type) +
                          (ce.typeId.startsWith('0x')
                            ? ` ${ce.typeId.slice(0, 6)}...`
                            : ` #${ce.typeId}`)}
                      </div>
                      <div class="chain-entity-bottom">
                        {ce.threadTitle !== 'undefined'
                          ? decodeURIComponent(ce.threadTitle)
                          : ''}
                      </div>
                    </div>
                  }
                  selected={selected}
                  key={ce.id ? ce.id : uuidv4()}
                />
              );
            }}
            itemPredicate={(query, ce: ChainEntity) => {
              if (ce.typeId.startsWith('0x')) {
                return false;
              } else {
                return (
                  ce.typeId
                    .toString()
                    .toLowerCase()
                    .includes(query.toLowerCase()) ||
                  ce.title
                    ?.toString()
                    .toLowerCase()
                    .includes(query.toLowerCase()) ||
                  chainEntityTypeToProposalName(ce.type)
                    .toLowerCase()
                    .includes(query.toLowerCase())
                );
              }
            }}
            onSelect={(ce: ChainEntity) => {
              if (
                vnode.attrs.chainEntitiesToSet
                  .map((ce_) => ce_.id)
                  .indexOf(ce.id) !== -1
              ) {
                const index = vnode.attrs.chainEntitiesToSet.findIndex(
                  (ce_) => ce_.id === ce.id
                );
                vnode.attrs.chainEntitiesToSet.splice(index, 1);
              } else {
                vnode.attrs.chainEntitiesToSet.push(ce);
              }
              onSelect(ce);
            }}
          />
        ) : (
          <div class="chain-entities-selector-placeholder">
            <div class="chain-entities-selector-placeholder-text">
              {this.chainEntitiesLoaded
                ? 'Select "In Voting" to begin.'
                : 'Loading on-chain proposals...'}
            </div>
          </div>
        )}
      </div>
    );
  }
}

type StageEditorAttrs = {
  onChangeHandler: () => void;
  openStateHandler: () => void;
  popoverMenu?: boolean;
  thread: OffchainThread;
};

export class StageEditor implements m.ClassComponent<StageEditorAttrs> {
  chainEntitiesToSet: ChainEntity[];
  isOpen: boolean;
  snapshotProposalsToSet: SnapshotProposal[];
  stage: OffchainThreadStage;

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
    if (!app.chain?.meta?.chain) return;

    const { customStages } = app.chain?.meta?.chain;

    const stages = !customStages
      ? [
          OffchainThreadStage.Discussion,
          OffchainThreadStage.ProposalInReview,
          OffchainThreadStage.Voting,
          OffchainThreadStage.Passed,
          OffchainThreadStage.Failed,
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
                  label={offchainThreadStageToLabel(targetStage)}
                  onclick={() => {
                    this.stage = targetStage;
                  }}
                />
              ))}
            </div>,
            app.chain?.meta?.chain.snapshot && (
              <SnapshotProposalSelector
                thread={vnode.attrs.thread}
                onSelect={(sn) => {
                  if (
                    this.stage === OffchainThreadStage.Discussion ||
                    this.stage === OffchainThreadStage.ProposalInReview
                  ) {
                    this.stage = OffchainThreadStage.Voting;
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
                    this.stage === OffchainThreadStage.Discussion ||
                    this.stage === OffchainThreadStage.ProposalInReview
                  ) {
                    this.stage = OffchainThreadStage.Voting;
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
