import 'components/poll_editor.scss';

import m from 'mithril';
import $ from 'jquery';
import { Switch, Button, Classes, Dialog } from 'construct-ui';

import app from 'state';
import { OffchainThread } from 'models';

const PollEditor: m.Component<{
  thread: OffchainThread;
  onChangeHandler: Function;
}, {
  // poll: OffchainThreadPoll;
}> = {
  view: (vnode) => {
    return m('.PollEditor', [
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        class: 'PollEditorDialog',
        content: [
          m(Switch, {
            intent: 'positive',
            label: 'Turn on polling',
          }),
          m('p', [
            'Once turned on, this poll will run for 7 days.',
          ]),
        ],
        hasBackdrop: true,
        isOpen: true,
        inline: false,
        onClose: () => {
          vnode.attrs.onChangeHandler();
        },
        title: 'Create offchain poll',
        transitionDuration: 200,
        footer: m(`.${Classes.ALIGN_RIGHT}`, [
          m(Button, {
            label: 'Cancel',
            rounded: true,
            onclick: () => {
              vnode.attrs.onChangeHandler();
            },
          }),
          m(Button, {
            label: 'Save changes',
            intent: 'primary',
            rounded: true,
            onclick: async () => {
              vnode.attrs.onChangeHandler();
            },
          }),
        ])
      })
    ]);
  }
};

export default PollEditor;
