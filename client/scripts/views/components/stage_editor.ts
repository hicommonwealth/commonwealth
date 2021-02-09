import m from 'mithril';
import $ from 'jquery';
import { Button, Classes, Dialog, Icon, Icons, MenuItem } from 'construct-ui';

import app from 'state';
import { offchainThreadStageToLabel } from 'helpers';
import { OffchainThread, OffchainThreadStage } from 'models';

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
            label: 'Close',
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
