/* eslint-disable @typescript-eslint/ban-types */
import 'components/stage_editor.scss';

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

import app from 'state';
import { offchainThreadStageToLabel, parseCustomStages } from 'helpers';
import { ChainEntity, OffchainThread, OffchainThreadStage } from 'models';
import { chainEntityTypeToProposalName } from 'identifiers';
import { EntityRefreshOption } from 'controllers/server/chain_entities';
import {
  loadMultipleSpacesData,
  SnapshotProposal,
} from 'helpers/snapshot_utils';

const SnapshotProposalSelector: m.Component<
  {
    thread: OffchainThread;
    onSelect;
    snapshotProposalsToSet: SnapshotProposal[];
  },
  {
    initialized: boolean;
    snapshotProposalsLoaded: boolean;
    all_proposals: SnapshotProposal[];
  }
> = {
  view: (vnode) => {
    const { thread, onSelect } = vnode.attrs;
    if (!app.chain || !app.activeChainId()) return;
    if (!vnode.state.initialized) {
      vnode.state.all_proposals = [];
      vnode.state.initialized = true;
      loadMultipleSpacesData(app.chain.meta.chain.snapshot).then((data) => {
        for (const { proposals } of data) {
          vnode.state.all_proposals = [
            ...vnode.state.all_proposals,
            ...proposals,
          ];
        }
        vnode.state.snapshotProposalsLoaded = true;
        m.redraw();
      });
    }

    return m('.ChainEntitiesSelector', [
      vnode.state.snapshotProposalsLoaded
        ? m(QueryList, {
            checkmark: true,
            items: vnode.state.all_proposals.sort((a, b) => {
              return b.created - a.created;
            }),
            inputAttrs: {
              placeholder: 'Search for an existing snapshot proposal...',
            },
            itemRender: (sn: SnapshotProposal, idx: number) => {
              const selected = sn.id === vnode.attrs.thread.snapshotProposal;
              // TODO: show additional info on the ListItem, like any set proposal title, the creator, or other metadata
              return m(ListItem, {
                label: m('.chain-entity-info', [
                  m('.chain-entity-top', `${sn.title.slice(0, 60)}...`),
                  m('.chain-entity-bottom', `Hash: ${sn.id}`),
                ]),
                selected,
                key: sn.id,
              });
            },
            itemPredicate: (query, sn: SnapshotProposal, idx) => {
              // TODO
              return sn.title
                ?.toString()
                .toLowerCase()
                .includes(query.toLowerCase());
            },
            onSelect: (sn: SnapshotProposal) => {
              onSelect(sn);
            },
          })
        : m('.chain-entities-selector-placeholder', [
            m('.chain-entities-selector-placeholder-text', [
              vnode.state.snapshotProposalsLoaded
                ? 'TODO: how to begin?'
                : 'Loading snapshot proposals...',
            ]),
          ]),
    ]);
  },
};

const ChainEntitiesSelector: m.Component<
  {
    thread: OffchainThread;
    onSelect;
    chainEntitiesToSet: ChainEntity[];
  },
  {
    initialized: boolean;
    chainEntities: ChainEntity[];
    chainEntitiesLoaded: boolean;
  }
> = {
  view: (vnode) => {
    const { thread, onSelect } = vnode.attrs;
    if (!app.chain || !app.activeChainId()) return;
    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      app.chain.chainEntities
        ?.refresh(app.chain.id, EntityRefreshOption.AllEntities)
        .then((entities) => {
          // refreshing loads the latest chain entities into app.chain.chainEntities store
          vnode.state.chainEntitiesLoaded = true;
          m.redraw();
        });
    }

    return m('.ChainEntitiesSelector', [
      vnode.state.chainEntitiesLoaded
        ? m(QueryList, {
            checkmark: true,
            items: app.chain.chainEntities.store.getAll().sort((a, b) => {
              if (!a.threadId && b.threadId) return -1;
              if (a.threadId && !b.threadId) return 1;
              return 0;
            }),
            inputAttrs: {
              placeholder: 'Search for an existing proposal...',
            },
            itemRender: (ce: ChainEntity, idx: number) => {
              const selected =
                vnode.attrs.chainEntitiesToSet
                  .map((ce_) => ce_.id)
                  .indexOf(ce.id) !== -1;
              // TODO: show additional info on the ListItem, like any set proposal title, the creator, or other metadata
              return m(ListItem, {
                disabled: ce.threadId && ce.threadId !== thread.id,
                label: m('.chain-entity-info', [
                  m(
                    '.chain-entity-top',
                    chainEntityTypeToProposalName(ce.type) +
                      (ce.typeId.startsWith('0x')
                        ? ` ${ce.typeId.slice(0, 6)}...`
                        : ` #${ce.typeId}`)
                  ),
                  m(
                    '.chain-entity-bottom',
                    ce.threadTitle !== 'undefined'
                      ? decodeURIComponent(ce.threadTitle)
                      : ''
                  ),
                ]),
                selected,
                key: ce.id ? ce.id : uuidv4(),
              });
            },
            itemPredicate: (query, ce: ChainEntity, idx) => {
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
            },
            onSelect: (ce: ChainEntity) => {
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
            },
          })
        : m('.chain-entities-selector-placeholder', [
            m('.chain-entities-selector-placeholder-text', [
              vnode.state.chainEntitiesLoaded
                ? 'Select "In Voting" to begin.'
                : 'Loading on-chain proposals...',
            ]),
          ]),
    ]);
  },
};

const StageEditor: m.Component<
  {
    thread: OffchainThread;
    popoverMenu?: boolean;
    onChangeHandler: Function;
    openStateHandler: Function;
  },
  {
    stage: OffchainThreadStage;
    isOpen: boolean;
    chainEntitiesToSet: ChainEntity[];
    snapshotProposalsToSet: SnapshotProposal[];
  }
> = {
  oninit: (vnode) => {
    vnode.state.isOpen = !!vnode.attrs.popoverMenu;
    vnode.state.stage = vnode.attrs.thread.stage;

    vnode.state.chainEntitiesToSet = [];
    vnode.state.snapshotProposalsToSet = [];
    vnode.attrs.thread.chainEntities.forEach((ce) =>
      vnode.state.chainEntitiesToSet.push(ce)
    );
  },
  view: (vnode) => {
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

    return m('.StageEditor', [
      !vnode.attrs.popoverMenu &&
        m(
          'a',
          {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              vnode.state.isOpen = true;
            },
          },
          'Edit stage'
        ),
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        class: 'StageEditorDialog',
        content: [
          m('.stage-options', [
            stages.map((targetStage) =>
              m(Button, {
                class: 'discussions-stage',
                active: vnode.state.stage === targetStage,
                iconLeft:
                  vnode.state.stage === targetStage ? Icons.CHECK : null,
                rounded: true,
                size: 'sm',
                label: offchainThreadStageToLabel(targetStage),
                onclick: (e) => {
                  vnode.state.stage = targetStage;
                },
              })
            ),
          ]),
          app.chain?.meta?.chain.snapshot &&
            m(SnapshotProposalSelector, {
              thread: vnode.attrs.thread,
              onSelect: (sn) => {
                if (
                  vnode.state.stage === OffchainThreadStage.Discussion ||
                  vnode.state.stage === OffchainThreadStage.ProposalInReview
                ) {
                  vnode.state.stage = OffchainThreadStage.Voting;
                }
                if (sn.id === vnode.attrs.thread.snapshotProposal) {
                  vnode.state.snapshotProposalsToSet = [];
                  vnode.attrs.thread.snapshotProposal = '';
                } else {
                  vnode.state.snapshotProposalsToSet = [sn];
                  vnode.attrs.thread.snapshotProposal = sn.id;
                }
              },
              snapshotProposalsToSet: vnode.state.snapshotProposalsToSet,
            }),
          app.chain.chainEntities &&
            m(ChainEntitiesSelector, {
              thread: vnode.attrs.thread,
              onSelect: (result) => {
                if (
                  vnode.state.stage === OffchainThreadStage.Discussion ||
                  vnode.state.stage === OffchainThreadStage.ProposalInReview
                ) {
                  vnode.state.stage = OffchainThreadStage.Voting;
                }
              },
              chainEntitiesToSet: vnode.state.chainEntitiesToSet,
            }),
        ],
        hasBackdrop: true,
        isOpen: vnode.attrs.popoverMenu ? true : vnode.state.isOpen,
        inline: false,
        onClose: () => {
          if (vnode.attrs.popoverMenu) {
            vnode.attrs.openStateHandler(false);
          } else {
            vnode.state.isOpen = false;
          }
        },
        title: 'Update proposal status',
        transitionDuration: 200,
        footer: m(`.${Classes.ALIGN_RIGHT}`, [
          m(Button, {
            label: 'Cancel',
            rounded: true,
            onclick: () => {
              if (vnode.attrs.popoverMenu) {
                vnode.attrs.openStateHandler(false);
              } else {
                vnode.state.isOpen = false;
              }
            },
          }),
          m(Button, {
            label: 'Save changes',
            intent: 'primary',
            rounded: true,
            onclick: async () => {
              const { stage } = vnode.state;
              const { thread } = vnode.attrs;
              // set stage
              try {
                await app.threads.setStage({
                  threadId: thread.id,
                  stage: vnode.state.stage,
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
                  entities: vnode.state.chainEntitiesToSet,
                });
                await app.threads.setLinkedSnapshotProposal({
                  threadId: thread.id,
                  snapshotProposal: vnode.state.snapshotProposalsToSet[0]?.id,
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
                vnode.state.stage,
                vnode.state.chainEntitiesToSet,
                vnode.state.snapshotProposalsToSet
              );

              if (vnode.attrs.popoverMenu) {
                vnode.attrs.openStateHandler(false);
              } else {
                vnode.state.isOpen = false;
              }
            },
          }),
        ]),
      }),
    ]);
  },
};

export default StageEditor;
