import 'components/poll_editor.scss';

import m from 'mithril';
import moment from 'moment';
import $ from 'jquery';
import { Switch, Button, Input, Classes, Dialog } from 'construct-ui';

import { getNextOffchainPollEndingTime } from 'utils';
import app from 'state';
import { OffchainThread } from 'models';

const PollEditor: m.Component<{
  thread: OffchainThread;
  onChangeHandler: Function;
}, {
  enabled: boolean;
  name: string;
  choices: string[];
}> = {
  view: (vnode) => {
    const { thread } = vnode.attrs;
    const { enabled } = vnode.state;

    // reset choices when initializing
    if (!vnode.state.choices || vnode.state.choices.length === 0) {
      vnode.state.choices = ['', ''];
    }

    return m('.PollEditor', [
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        class: 'PollEditorDialog',
        content: [
          m(Switch, {
            intent: 'positive',
            label: 'Enable polling',
            onchange: (e) => {
              vnode.state.enabled = (e.target as any).checked;
            }
          }),
          m('h4', { class: vnode.state.enabled ? '' : 'disabled' }, 'Question'),
          m(Input, {
            class: 'poll-editor-choices-question',
            name: 'Question',
            fluid: true,
            autocomplete: 'off',
            disabled: !enabled,
            placeholder: 'Do you support this proposal?',
            onchange: (e) => {
              vnode.state.name = (e.target as any).value;
            }
          }),
          m('h4', { class: vnode.state.enabled ? '' : 'disabled' }, 'Choices'),
          m('.poll-editor-choices', [
            m('.poll-editor-choice-buttons', [
              vnode.state.choices?.map((choice: string, index: number) => m(Input, {
                class: '.poll-editor-choice',
                placeholder: `${index + 1}.`,
                fluid: true,
                autocomplete: 'off',
                disabled: !enabled,
                onchange: (e) => {
                  vnode.state.choices[index] = (e.target as any).value;
                }
              })),
            ]),
            m(Button, {
              class: '.poll-editor-add-choice',
              label: 'Add choice',
              fluid: true,
              rounded: true,
              disabled: !enabled || vnode.state.choices.length >= 6,
              onclick: (e) => {
                vnode.state.choices.push('');
              }
            }),
            m(Button, {
              class: '.poll-editor-remove-choice',
              label: 'Remove choice',
              fluid: true,
              rounded: true,
              disabled: !enabled || vnode.state.choices.length <= 2,
              onclick: (e) => {
                vnode.state.choices.pop();
              }
            }),
          ]),
          m('.poll-editor-footer', [
            'Offchain polls run for at least 5 days, ending on the 1st and 15th of each month. ',
            'If started now, this poll will be open until ',
            getNextOffchainPollEndingTime(moment()).local().format('lll'),
            '.'
          ]),
        ],
        hasBackdrop: true,
        isOpen: true,
        inline: false,
        onClose: () => {
          vnode.attrs.onChangeHandler();
        },
        title: 'Create poll',
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
              if (vnode.state.enabled) {
                await app.threads.setPolling({
                  threadId: thread.id,
                  name: vnode.state.name,
                  choices: vnode.state.choices,
                });
                vnode.attrs.onChangeHandler();
              } else {
                vnode.attrs.onChangeHandler();
              }
            },
          }),
        ])
      })
    ]);
  }
};

export default PollEditor;
