import 'components/stage_editor.scss';

import m from 'mithril';
import $ from 'jquery';
import { QueryList, ListItem, Button, Classes, Dialog, InputSelect, Icon, Icons, MenuItem } from 'construct-ui';

import app from 'state';
import { offchainThreadStageToLabel } from 'helpers';
import { ChainEntity, OffchainThread, OffchainThreadStage } from 'models';
import { chainEntityTypeToProposalName } from 'identifiers';
import ChainEntityController, { EntityRefreshOption } from 'controllers/server/chain_entities';

const ChainEntitiesSelector: m.Component<{
  thread: OffchainThread;
}, {
  initialized: boolean;
  chainEntities: ChainEntity[];
}> = {
  view: (vnode) => {
    const { thread } = vnode.attrs;
    if (!app.chain || !app.activeChainId()) return;
    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      app.chain.chainEntities.refresh(app.chain.id, EntityRefreshOption.AllEntities);
      // We don't handle the returned data right now, and instead look directly in the app.chain.chainEntities store
    }

    const associatedChainEntityIds = thread.chainEntities.map((ce) => ce.id);

    return m('.ChainEntitiesSelector', [
      m(QueryList, {
        checkmark: true,
        items: app.chain.chainEntities.store.getAll(),
        inputAttrs: {
          placeholder: 'Search for an existing proposal...',
        },
        itemRender: (ce: ChainEntity, idx: number) => {
          const selected = associatedChainEntityIds.indexOf(ce.id) !== -1;
          return m(ListItem, {
            label: chainEntityTypeToProposalName(ce.type) +
              (ce.typeId.startsWith('0x') ? '' : ` #${ce.typeId}`),
            selected,
            key: ce.id,
          });
        },
        itemPredicate: (query, ce: ChainEntity, idx) => {
          if (ce.typeId.startsWith('0x')) {
            return false;
          } else {
            return ce.typeId.toString().toLowerCase().includes(query.toLowerCase());
          }
        },
        onSelect: (ce: ChainEntity) => {
          if (associatedChainEntityIds.indexOf(ce.id) !== -1) {
            const index = thread.chainEntities.findIndex((ce_) => ce_.id === ce.id);
            thread.chainEntities.splice(index, 1); // TODO: actually write the updated chain entity relation to the backend
          } else {
            thread.chainEntities.push(ce); // TODO: actually write the updated chain entity relation to the backend
          }
        },
      }),
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
}> = {
  oninit: (vnode) => {
    vnode.state.isOpen = !!vnode.attrs.popoverMenu;
    vnode.state.stage = vnode.attrs.thread.stage;
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
        content: [
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
              style: 'margin: 3px 6px;',
              label: offchainThreadStageToLabel(targetStage),
              onclick: (e) => {
                vnode.state.stage = targetStage;
              }
            })),
          ]),
          m(ChainEntitiesSelector, { thread: vnode.attrs.thread }),
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
              try {
                await app.threads.setStage({ threadId: thread.id, stage: vnode.state.stage });
                vnode.attrs.onChangeHandler(vnode.state.stage);
              } catch (err) {
                console.log('Failed to update stage');
                throw new Error((err.responseJSON && err.responseJSON.error)
                  ? err.responseJSON.error
                  : 'Failed to update stage');
              }
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
