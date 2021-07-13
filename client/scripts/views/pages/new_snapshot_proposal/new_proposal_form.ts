import 'pages/new_proposal_page.scss';
import 'mithril-datepicker/src/style.css';
import 'mithril-timepicker/src/style.css';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Input, Form, FormLabel, FormGroup, Button, Callout } from 'construct-ui';
import DatePicker from 'mithril-datepicker';
// import TimePicker from 'mithril-timepicker';
import moment from 'moment';
import { bufferToHex } from 'ethereumjs-util';
import getProvider from '@snapshot-labs/snapshot.js/src/utils/provider';
import { getBlockNumber, signMessage } from '@snapshot-labs/snapshot.js/src/utils/web3';
import { version } from '@snapshot-labs/snapshot.js/src/constants.json';
// import { getScores } from '@snapshot-labs/snapshot.js/src/utils';

import app from 'state';
import snapshotClient from 'helpers/snapshot_client';
import { formatSpace } from 'helpers';

import { notifyError } from 'controllers/app/notifications';
import QuillEditor from 'views/components/quill_editor';
import { idToProposal } from 'identifiers';


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
  start: number;
  end: number;
  snapshot: number,
  metadata: {},
  type: string
}

enum NewThreadErrors {
  NoBody = 'Proposal body cannot be blank!',
  NoTitle = 'Title cannot be blank!',
  NoChoices = 'Choices cannot be blank!',
  NoStartDate = 'Start Date cannot be blank!',
  NoEndDate = 'End Date cannot be blank!',
  SomethingWentWrong = "Something went wrong!"
}

const newThread = async (
  form,
  quillEditorState,
  author,
  space, 
  snapshotId
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
  form.snapshot = await getBlockNumber(getProvider(space.network));
  form.metadata.network = space.network;
  form.metadata.strategies = space.strategies;

  const msg: any = {
    address: author.address,
    msg: JSON.stringify({
      version,
      timestamp: (Date.now() / 1e3).toFixed(),
      space: space.key,
      type: 'proposal',
      payload: form
    })
  };

  const msgBuffer = bufferToHex(new Buffer(msg.msg, 'utf8'));
  msg.sig = await (window as any).ethereum.request({method: 'personal_sign', params: [msgBuffer, author.address]});

  let result = await $.post(`${app.serverUrl()}/snapshotAPI/sendMessage`, { ...msg });

  if (result.status === "Failure") {
    mixpanel.track('Create Snapshot Proposal', {
      'Step No': 2,
      'Step' : 'Incorrect Proposal',
    });

    const errorMessage =
      result && result.message.error_description
        ? `${result.message.error_description}`
        : NewThreadErrors.SomethingWentWrong;
    throw new Error(errorMessage);
  } else if (result.status === "Success") {
    await app.user.notifications.refresh();

    m.route.set(`/${app.activeId()}/snapshot-proposal/${snapshotId}/${result.message.ipfsHash}`);

    mixpanel.track('Create Snapshot Proposal', {
      'Step No': 2,
      Step: 'Filled in Snapshot Proposal',
    });
  }
};

const newLink = async (form, quillEditorState, author, space, snapshotId) => {
  const errors = await newThread(form, quillEditorState, author, space, snapshotId);
  return errors;
};

export const NewProposalForm: m.Component<{snapshotId: string}, {
  form: IThreadForm,
  quillEditorState,
  saving: boolean,
  space: any,
  members: string[]
}> = {
  oninit: (vnode) => {
    vnode.state.space = {};
    vnode.state.members = [];
    vnode.state.form = {
      name: '',
      body: '',
      choices: ['Yes', 'No'],
      start: 0,
      end: 0,
      snapshot: 0,
      metadata: {},
      type: 'single-choice'
    };

    snapshotClient.getSpaces().then(response => {
      let spaces: any = fromEntries(
        Object.entries(response).map(space => [
          space[0],
          formatSpace(space[0], space[1])
        ])
      );
      console.log(spaces);
      let space = spaces[vnode.attrs.snapshotId];
      console.log(space);
      vnode.state.space = space;
      vnode.state.members = space.members;
      m.redraw();

      // getScores(
      //   space.key,
      //   space.strategies,
      //   space.network,
      //   getProvider(space.network),
      //   [app.user.activeAccount.address]
      // ).then(response => {
      //   console.log(response)
      //   let scores = response
      //     .map(score => Object.values(score).reduce((a, b) => (a as number) + (b as number), 0))
      //     .reduce((a, b) => (a as number) + (b as number), 0);
      //   vnode.state.userScore = scores as number;
      //   vnode.state.space = space;
      //   m.redraw();
      // });
    });
  },

  view: (vnode) => {
    if (!app.community && !app.chain) return;

    const pathVars = m.parsePathname(window.location.href);
    let fromProposal = null;
    let fromProposalBody = null;
    if (pathVars.params.fromProposalType && pathVars.params.fromProposalId) {
      fromProposal = idToProposal(pathVars.params.fromProposalType, pathVars.params.fromProposalId);
      vnode.state.form.name = fromProposal.title;
      if (fromProposal.body) {
        try {
          const parsedBody = JSON.parse(fromProposal.body);
          fromProposalBody = parsedBody.ops[0].insert;
        } catch (e) {
          console.error(e);
        }
      }
    }

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

    const isMember = author && author.address && vnode.state.members.includes(author.address.toLowerCase());

    let isValid = vnode.state.space !== undefined && 
      (!vnode.state.space.filters?.onlyMembers ||
        (vnode.state.space.filters?.onlyMembers && isMember));
      // (vnode.state.space.filters?.minScore === 0 ||
      //   (vnode.state.space.filters?.minScore > 0 && vnode.state.userScore) ||
      //   isMember);

    const today = new Date();
    const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

    return m('.NewThreadForm', {
      oncreate: (vvnode) => {
        $(vvnode.dom).find('.cui-input input').prop('autocomplete', 'off').focus();
      },
    }, [
      m('.new-thread-form-body', [
        vnode.state.space.filters?.onlyMembers && !isMember && 
        m(Callout, {
          class: 'no-profile-callout',
          intent: 'primary',
          content: [
            'You need to be a member of the space in order to submit a proposal.',
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
                contentsDoc: fromProposalBody || '', // Prevent the editor from being filled in with previous content
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
                disabled: !author || vnode.state.saving || !isValid,
                rounded: true,
                onclick: async (e) => {
                  vnode.state.saving = true;
                  try {
                    await newLink(vnode.state.form, vnode.state.quillEditorState, author, vnode.state.space, vnode.attrs.snapshotId);
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
                date: today,
                locale: 'en-us',
                weekStart: 0,
                onchange: function(chosenDate){
                  vnode.state.form.start = moment(chosenDate).unix();
                }
              }
            ),
            m('h4', 'End Date'),
            m(DatePicker,
              {
                date: nextWeek,
                locale: 'en-us',
                weekStart: 0,
                onchange: function(chosenDate){
                  vnode.state.form.end = moment(chosenDate).unix();
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
