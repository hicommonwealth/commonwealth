import 'pages/new_proposal_page.scss';
import 'mithril-datepicker/src/style.css';
import 'mithril-timepicker/src/style.css';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Input, Form, FormLabel, FormGroup, Button, Callout } from 'construct-ui';
import DatePicker from 'mithril-datepicker';
import TimePicker from 'mithril-timepicker';
import moment from 'moment';
import Web3 from 'web3';
import getProvider from '@snapshot-labs/snapshot.js/src/utils/provider';
import { getBlockNumber } from '@snapshot-labs/snapshot.js/src/utils/web3';
import { version } from '@snapshot-labs/snapshot.js/src/constants.json';
import { signMessage } from '@snapshot-labs/snapshot.js/src/utils/web3';

import app from 'state';
import snapshotClient from 'helpers/snapshot_client';
import { formatSpace } from 'helpers';

import { notifyError } from 'controllers/app/notifications';
import QuillEditor from 'views/components/quill_editor';


declare global {
  interface ObjectConstructor {
    fromEntries(xs: [string|number|symbol, any][]): object
  }
}

const fromEntries = (xs: [string|number|symbol, any][]) =>
  Object.fromEntries ? Object.fromEntries(xs) : xs.reduce((acc, [key, value]) => ({...acc, [key]: value}), {})

DatePicker.localize({
  weekStart: 1,
  locale: 'en',
  prevNextTitles: ['1M', '1Y', '10Y'],
  formatOptions: {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
})

interface IThreadForm {
  name: string;
  body: string;
  choices: string[];
  start: string;
  end: string;
  snapshot: '',
  metadata: {}
}

enum NewThreadErrors {
  NoBody = 'Proposal body cannot be blank',
  NoTitle = 'Title cannot be blank',
  NoChoices = 'Choices cannot be blank',
  NoStartDate = 'Start Date cannot be blank',
  NoEndDate = 'End Date cannot be blank',
  SomethingWentWrong = "Something went wrong"
}

const newThread = async (
  form,
  quillEditorState,
  author,
) => {
  const topics = app.chain
    ? app.chain.meta.chain.topics
    : app.community.meta.topics;

  if (!form.name) {
    throw new Error(NewThreadErrors.NoTitle);
  }

  if (!form.start) {
    throw new Error(NewThreadErrors.NoStartDate);
  }

  if (!form.end) {
    throw new Error(NewThreadErrors.NoEndDate);
  }

  if (!form.choices[0] || !form.choices[1]) {
    throw new Error(NewThreadErrors.NoChoices);
  }

  if (quillEditorState.editor.editor.isBlank()) {
    throw new Error(NewThreadErrors.NoBody);
  }

  quillEditorState.editor.enable(false);

  const mentionsEle = document.getElementsByClassName('ql-mention-list-container')[0];
  if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';
  const bodyText = !quillEditorState ? ''
    : quillEditorState.markdownMode
      ? quillEditorState.editor.getText()
      : JSON.stringify(quillEditorState.editor.getContents());

  form.body = bodyText;
  let spaces: any = await snapshotClient.getSpaces();

  spaces = fromEntries(
    Object.entries(spaces).map(space => [
      space[0],
      formatSpace(space[0], space[1])
    ])
  );
  let space = spaces[app.chain.meta.chain.snapshot];
  form.snapshot = await getBlockNumber(getProvider(space.network));
  form.metadata.network = space.network;
  form.metadata.strategies = space.strategies;
  let user = app.user.activeAccount;

  try {
    const msg: any = {
      address: user.address,
      msg: JSON.stringify({
        version,
        timestamp: (Date.now() / 1e3).toFixed(),
        space,
        type: 'proposal',
        form
      })
    };
    console.log(msg.msg);
    msg.sig = await signMessage((window as any).ethereum, msg.msg, user.address);
    console.log(msg);
    let result = await $.post(`${app.serverUrl()}/snapshotAPI/sendMessage`, {
      data: JSON.stringify(msg)
    });
    // dispatch('notify', [
    //   'green',
    //   type === 'delete-proposal'
    //     ? i18n.global.t('notify.proposalDeleted')
    //     : i18n.global.t('notify.yourIsIn', [type])
    // ]);
    console.log(result);
  } catch (e) {
    const errorMessage =
      e && e.error_description
        ? `Oops, ${e.error_description}`
        : NewThreadErrors.SomethingWentWrong;
    throw new Error(errorMessage);
  }

  await app.user.notifications.refresh();

  //m.route.set(`/${app.activeId()}/proposal/snapshot-proposal/${result.id}`);

  mixpanel.track('Create Snapshot Proposal', {
    'Step No': 2,
    Step: 'Filled in Snapshot Proposal',
  });
};

const newLink = async (form, quillEditorState, author) => {
  const errors = await newThread(form, quillEditorState, author);
  return errors;
};

export const NewProposalForm: m.Component<{}, {
  form: IThreadForm,
  quillEditorState,
  saving: boolean,
}> = {
  oninit: (vnode) => {
    vnode.state.form = {
      name: '',
      body: '',
      choices: ['Yes', 'No'],
      start: '',
      end: '',
      snapshot: '',
      metadata: {}
    };
  },

  view: (vnode) => {
    if (!app.community && !app.chain) return;
    const author = app.user.activeAccount;
    const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;
    if (vnode.state.quillEditorState?.container) {
      vnode.state.quillEditorState.container.tabIndex = 8;
    }

    const saveToLocalStorage = () => {
      localStorage.setItem(`${app.activeId()}-new-snapshot-proposal-name`, vnode.state.form.name);
    };

    const populateFromLocalStorage = () => {
      vnode.state.form.name = localStorage.getItem(`${app.activeId()}-new-snapshot-proposal-name`);
    };

    const clearLocalStorage = () => {
      localStorage.removeItem(`${app.activeId()}-new-snapshot-proposal-name`);
    };

    return m('.NewThreadForm', {
      oncreate: (vvnode) => {
        $(vvnode.dom).find('.cui-input input').prop('autocomplete', 'off').focus();
      },
    }, [
      m('.new-thread-form-body', [
        m(Callout, {
          class: 'no-profile-callout',
          intent: 'primary',
          content: [
            'You need to have a minimum of 1 YFI in order to submit a proposal',
          ],
        }),
        m('.new-snapshot-proposal-form', [
          m(Form, [
            m(FormGroup, { span: { xs: 12, sm: 12 }, order: 2 }, [
              m(Input, {
                placeholder: 'Question',
                oninput: (e) => {
                  e.redraw = false; // do not redraw on input
                  const { value } = e.target as any;
                  vnode.state.form.name = value;
                  localStorage.setItem(`${app.activeId()}-new-snapshot-proposal-name`, vnode.state.form.name);
                },
                defaultValue: vnode.state.form.name,
                tabindex: 1,
              }),
            ]),
            m(FormGroup, { order: 4 }, [
              m(QuillEditor, {
                contentsDoc: '', // Prevent the editor from being filled in with previous content
                oncreateBind: (state) => {
                  vnode.state.quillEditorState = state;
                },
                placeholder: 'What is your proposal',
                editorNamespace: 'new-proposal',
                tabindex: 2,
              })
            ]),
            m(FormGroup, { order: 5 }, [
              m(Button, {
                intent: 'primary',
                label: 'Publish',
                name: 'submit',
                disabled: !author || vnode.state.saving,
                rounded: true,
                onclick: async (e) => {
                  vnode.state.saving = true;
                  try {
                    await newLink(vnode.state.form, vnode.state.quillEditorState, author);
                    vnode.state.saving = false;
                    clearLocalStorage();
                  } catch (err) {
                    vnode.state.saving = false;
                    notifyError(err.message);
                  }
                },
              }),
            ]),
          ]),
          m(Form, [
            m('h4', 'Choices'),
            m(FormGroup, [
              m(FormLabel, 'Choice 1'),
              m(Input, {
                name: 'targets',
                placeholder: 'Yes',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.choices[0] = result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Choice 2'),
              m(Input, {
                name: 'targets',
                placeholder: 'No',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.choices[1] = result;
                  m.redraw();
                },
              }),
            ]),
            m('h4', 'Start Date'),
            m(DatePicker,
              {
                locale: 'en-us',
                weekStart: 0,
                onchange: function(chosenDate){
                  vnode.state.form.start = moment(chosenDate).unix().toString();
                }
              }
            ),
            m('h4', 'End Date'),
            m(DatePicker,
              {
                locale: 'en-us',
                weekStart: 0,
                onchange: function(chosenDate){
                  vnode.state.form.end = moment(chosenDate).unix().toString();
                }
              }
            ),
          ]),
        ]),
      ]),
    ]);
  }
};

export default NewProposalForm;
