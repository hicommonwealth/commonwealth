import 'components/poll_editor.scss';

import m from 'mithril';
import moment from 'moment';
import $ from 'jquery';
import { Switch, Button, Classes, Dialog } from 'construct-ui';

import { getNextOffchainPollEndingTime } from 'utils';
import app from 'state';
import { OffchainThread } from 'models';

const PollEditor: m.Component<{
  thread: OffchainThread;
  onChangeHandler: Function;
}, {
  value: boolean;
}> = {
  view: (vnode) => {
    const { thread } = vnode.attrs;

    return m('.PollEditor', [
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        class: 'PollEditorDialog',
        content: [
          m('p', [
            'Create an off-chain poll to measure sentiment around this thread.'
          ]),
          m(Switch, {
            intent: 'positive',
            label: 'Turn on polling',
            onchange: (e) => {
              vnode.state.value = (e.target as any).checked;
            }
          }),
          m('p.secondary', [
            'Offchain polls end on the 1st and 15th of each month.'
          ]),
          m('p.secondary', [
            'Each poll runs for at least 5 days.',
          ]),
          m('p.secondary', [
            'If started now, this poll will end ',
            m('strong', getNextOffchainPollEndingTime(moment()).local().format('lll')),
            '.'
          ]),
        ],
        hasBackdrop: true,
        isOpen: true,
        inline: false,
        onClose: () => {
          vnode.attrs.onChangeHandler();
        },
        title: 'Start off-chain polling',
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
              if (vnode.state.value) {
                await app.threads.setPolling({ threadId: thread.id });
              }
              vnode.attrs.onChangeHandler();
            },
          }),
        ])
      })
    ]);
  }
};

export default PollEditor;
