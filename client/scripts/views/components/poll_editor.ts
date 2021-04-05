import m from 'mithril';
import $ from 'jquery';
import { QueryList, ListItem, Button, Classes, Dialog, InputSelect, Icon, Icons, MenuItem } from 'construct-ui';

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
          m('h4', 'Select a poll'),
          m('.poll-options', [
            'poll options',
          ]),
        ],
        hasBackdrop: true,
        isOpen: true,
        inline: false,
        onClose: () => {
          vnode.attrs.onChangeHandler();
        },
        title: 'Edit poll',
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
