import 'components/poll_editor.scss';

import m from 'mithril';
import moment from 'moment';
import {
  Switch,
  Button,
  Input,
  Classes,
  Dialog,
  SelectList,
  Icons,
} from 'construct-ui';

import { getNextOffchainPollEndingTime } from 'utils';
import app from 'state';
import { OffchainThread } from 'models';
import _ from 'underscore';
import { pluralize } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

const PollEditor: m.Component<
  {
    thread: OffchainThread;
    onChangeHandler: Function;
  },
  {
    pollingEnabled: boolean;
    customDurationEnabled: boolean;
    customDuration: string;
    name: string;
    choices: string[];
  }
> = {
  view: (vnode) => {
    const { thread } = vnode.attrs;
    const { pollingEnabled, customDurationEnabled, customDuration } =
      vnode.state;

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
              vnode.state.pollingEnabled = (e.target as any).checked;
            },
          }),
          m(
            'h4',
            { class: vnode.state.pollingEnabled ? '' : 'disabled' },
            'Question'
          ),
          m(Input, {
            class: 'poll-editor-choices-question',
            name: 'Question',
            fluid: true,
            autocomplete: 'off',
            disabled: !pollingEnabled,
            placeholder: 'Do you support this proposal?',
            onchange: (e) => {
              vnode.state.name = (e.target as any).value;
            },
          }),
          m(
            'h4',
            { class: vnode.state.pollingEnabled ? '' : 'disabled' },
            'Choices'
          ),
          m('.poll-editor-choices', [
            m('.poll-editor-choice-buttons', [
              vnode.state.choices?.map((choice: string, index: number) =>
                m(Input, {
                  class: '.poll-editor-choice',
                  placeholder: `${index + 1}.`,
                  fluid: true,
                  autocomplete: 'off',
                  disabled: !pollingEnabled,
                  onchange: (e) => {
                    vnode.state.choices[index] = (e.target as any).value;
                  },
                })
              ),
            ]),
            m(Button, {
              class: '.poll-editor-add-choice',
              label: 'Add choice',
              fluid: true,
              rounded: true,
              disabled: !pollingEnabled || vnode.state.choices.length >= 6,
              onclick: (e) => {
                vnode.state.choices.push('');
              },
            }),
            m(Button, {
              class: '.poll-editor-remove-choice',
              label: 'Remove choice',
              fluid: true,
              rounded: true,
              disabled: !pollingEnabled || vnode.state.choices.length <= 2,
              onclick: (e) => {
                vnode.state.choices.pop();
              },
            }),
          ]),
          m(
            '.poll-duration-copy',
            customDurationEnabled
              ? customDuration === 'Infinite'
                ? 'This poll will never expire.'
                : [
                    'If started now, this poll will stay open until ',
                    moment()
                      .add(customDuration.split(' ')[0], 'days')
                      .local()
                      .format('lll'),
                    '.',
                  ]
              : [
                  'By default, offchain polls run for at least 5 days, ending on the 1st and 15th of each month. ',
                  'If started now, this poll would stay open until ',
                  getNextOffchainPollEndingTime(moment()).local().format('lll'),
                  '. Override?',
                ]
          ),
          m('.poll-editor-duration', [
            m(Switch, {
              intent: 'positive',
              disabled: !pollingEnabled,
              label: 'Custom duration',
              onchange: (e) => {
                vnode.state.customDurationEnabled =
                  !vnode.state.customDurationEnabled;
                vnode.state.customDuration = 'Infinite';
              },
            }),
            m(SelectList, {
              class: 'custom-duration-items',
              filterable: false,
              items: ['Infinite'].concat(
                _.range(1, 31).map((n) => pluralize(Number(n), 'day'))
              ),
              itemRender: (n) => m('.duration-item', n),
              onSelect: (e) => {
                vnode.state.customDuration = e as string;
              },
              trigger: m(Button, {
                disabled: !pollingEnabled || !customDurationEnabled,
                align: 'left',
                compact: true,
                iconRight: Icons.CHEVRON_DOWN,
                label: vnode.state.customDuration || 'Infinite',
                style: 'min-width: 300px',
              }),
            }),
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
              if (vnode.state.pollingEnabled) {
                if (!vnode.state.name) {
                  notifyError('Must set poll name');
                  return;
                }
                if (
                  !vnode.state.choices[0]?.length ||
                  !vnode.state.choices[1]?.length
                ) {
                  notifyError('Must set poll choices');
                  return;
                }
                try {
                  await app.threads.setPolling({
                    threadId: thread.id,
                    name: vnode.state.name,
                    choices: vnode.state.choices,
                    customDuration: vnode.state.customDuration,
                  });
                  notifySuccess('Poll creation succeeded');
                } catch (e) {
                  console.error(e);
                }
                vnode.attrs.onChangeHandler();
              } else {
                vnode.attrs.onChangeHandler();
              }
            },
          }),
        ]),
      }),
    ]);
  },
};

export default PollEditor;
