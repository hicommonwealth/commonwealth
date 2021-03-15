import 'components/stage_editor.scss';

import m from 'mithril';
import $ from 'jquery';
import { uuidv4 } from 'lib/util';
import { QueryList, ListItem, Button, Classes, Dialog, InputSelect, Icon, Icons, MenuItem } from 'construct-ui';

import app from 'state';
import { offchainThreadStageToLabel } from 'helpers';
import { ChainEntity, OffchainThread, OffchainThreadStage } from 'models';
import { chainEntityTypeToProposalName } from 'identifiers';
import ChainEntityController, { EntityRefreshOption } from 'controllers/server/chain_entities';

const ChainEntitiesSelector: m.Component<{
  thread: OffchainThread;
  enabled: boolean;
  chainEntitiesToSet: ChainEntity[];
}, {
  initialized: boolean;
  chainEntities: ChainEntity[];
  chainEntitiesLoaded: boolean;
}> = {
  view: (vnode) => {
    const { thread, enabled } = vnode.attrs;
    if (!app.chain || !app.activeChainId()) return;
    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      app.chain.chainEntities.refresh(app.chain.id, EntityRefreshOption.AllEntities).then((entities) => {
        // refreshing loads the latest chain entities into app.chain.chainEntities store
        vnode.state.chainEntitiesLoaded = true;
        m.redraw();
      });
    }

    return m('.ChainEntitiesSelector', [
      (enabled && vnode.state.chainEntitiesLoaded) ? m(QueryList, {
        checkmark: true,
        items: app.chain.chainEntities.store.getAll(),
        inputAttrs: {
          placeholder: 'Search for an existing proposal...',
        },
        itemRender: (ce: ChainEntity, idx: number) => {
          const selected = vnode.attrs.chainEntitiesToSet.map((ce_) => ce_.id).indexOf(ce.id) !== -1;
          // TODO: show additional info on the ListItem, like any set proposal title, the creator, or other metadata
          return m(ListItem, {
            label: chainEntityTypeToProposalName(ce.type)
              + (ce.typeId.startsWith('0x') ? '' : ` #${ce.typeId}`)
              + (ce.title ? `: ${ce.title}` : ''),
            selected,
            key: ce.id ? ce.id : uuidv4(),
          });
        },
        itemPredicate: (query, ce: ChainEntity, idx) => {
          if (ce.typeId.startsWith('0x')) {
            return false;
          } else {
            return ce.typeId.toString().toLowerCase().includes(query.toLowerCase())
              || ce.title?.toString().toLowerCase().includes(query.toLowerCase())
              || chainEntityTypeToProposalName(ce.type).toLowerCase().includes(query.toLowerCase());
          }
        },
        onSelect: (ce: ChainEntity) => {
          if (vnode.attrs.chainEntitiesToSet.map((ce_) => ce_.id).indexOf(ce.id) !== -1) {
            const index = vnode.attrs.chainEntitiesToSet.findIndex((ce_) => ce_.id === ce.id);
            vnode.attrs.chainEntitiesToSet.splice(index, 1);
          } else {
            vnode.attrs.chainEntitiesToSet.push(ce);
          }
        },
      }) : m('.chain-entities-selector-placeholder', [
        m('.chain-entities-selector-placeholder-text', [
          vnode.state.chainEntitiesLoaded
            ? 'Available once the thread is set to Voting or later'
            : 'Loading on-chain proposals...'
        ]),
      ]),
    ]);
  }
};

const StageEditor: m.Component<{
  thread: OffchainThread;
  popoverMenu?: boolean;
  onChangeHandler: Function;
  openStateHandler: Function;
}, {
  stage: OffchainThreadStage;
  isOpen: boolean;
  chainEntitiesToSet: ChainEntity[];
}> = {
  oninit: (vnode) => {
    vnode.state.isOpen = !!vnode.attrs.popoverMenu;
    vnode.state.stage = vnode.attrs.thread.stage;

    vnode.state.chainEntitiesToSet = [];
    vnode.attrs.thread.chainEntities.forEach((ce) => vnode.state.chainEntitiesToSet.push(ce));
  },
  view: (vnode) => {
    return m('.StageEditor', [
      !vnode.attrs.popoverMenu && m('a', {
        href: '#',
        onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
      }, 'Edit stage'),
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        class: 'StageEditorDialog',
        content: [
          m('h4', 'Select a stage'),
          m('.stage-options', [
            [
              OffchainThreadStage.Discussion,
              OffchainThreadStage.ProposalInReview,
              OffchainThreadStage.Voting,
              OffchainThreadStage.Passed,
              OffchainThreadStage.Failed,
              OffchainThreadStage.Abandoned,
            ].map((targetStage) => m(Button, {
              class: 'discussions-stage',
              active: vnode.state.stage === targetStage,
              rounded: true,
              size: 'sm',
              label: offchainThreadStageToLabel(targetStage),
              onclick: (e) => {
                vnode.state.stage = targetStage;
              }
            })),
          ]),
          app.chain && app.activeChainId() && m('h4', 'Link an on-chain proposal'),
          m(ChainEntitiesSelector, {
            thread: vnode.attrs.thread,
            enabled: vnode.state.stage !== OffchainThreadStage.Discussion
              && vnode.state.stage !== OffchainThreadStage.ProposalInReview,
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
        title: 'Edit stage',
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
                await app.threads.setStage({ threadId: thread.id, stage: vnode.state.stage });
              } catch (err) {
                console.log('Failed to update stage');
                throw new Error((err.responseJSON && err.responseJSON.error)
                  ? err.responseJSON.error
                  : 'Failed to update stage');
              }

              // set linked chain entities
              try {
                await app.threads.setLinkedChainEntities({ threadId: thread.id, entities: vnode.state.chainEntitiesToSet });
              } catch (err) {
                console.log('Failed to update linked proposals');
                throw new Error((err.responseJSON && err.responseJSON.error)
                  ? err.responseJSON.error
                  : 'Failed to update linked proposals');
              }

              vnode.attrs.onChangeHandler(vnode.state.stage, vnode.state.chainEntitiesToSet);

              if (vnode.attrs.popoverMenu) {
                vnode.attrs.openStateHandler(false);
              } else {
                vnode.state.isOpen = false;
              }
            },
          }),
        ])
      })
    ]);
  }
};

export default StageEditor;
