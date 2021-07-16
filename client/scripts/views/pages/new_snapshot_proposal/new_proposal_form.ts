import 'pages/snapshot/create_proposal.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Input, Form, FormLabel, FormGroup, Button, Callout, Spinner, RadioGroup, Radio } from 'construct-ui';

import moment from 'moment';
import { bufferToHex } from 'ethereumjs-util';
import snapshotJs from '@snapshot-labs/snapshot.js';

import app from 'state';

import { formatSpace } from 'helpers/snapshot_utils/snapshot_utils';

import { notifyError } from 'controllers/app/notifications';
import QuillEditor from 'views/components/quill_editor';
import { idToProposal } from 'identifiers';
import { capitalize } from 'lodash';
interface IThreadForm {
  name: string;
  body: string;
  choices: string[];
  start: string;
  end: string;
  snapshot: number,
  metadata: {},
  type: string,
}

enum NewThreadErrors {
  NoBody = 'Proposal body cannot be blank!',
  NoTitle = 'Title cannot be blank!',
  NoChoices = 'Choices cannot be blank!',
  NoStartDate = 'Start Date cannot be blank!',
  NoEndDate = 'End Date cannot be blank!',
  SomethingWentWrong = 'Something went wrong!'
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
  form.snapshot = await snapshotJs.utils.getBlockNumber(snapshotJs.utils.getProvider(space.network));
  form.metadata.network = space.network;
  form.metadata.strategies = space.strategies;

  const msg: any = {
    address: author.address,
    msg: JSON.stringify({
      version: '0.1.3',
      timestamp: (Date.now() / 1e3).toFixed(),
      space: space.key,
      type: 'proposal',
      payload: form
    })
  };

  const msgBuffer = bufferToHex(Buffer.from(msg.msg, 'utf8'));

  // TODO: do not use window.ethereum here
  msg.sig = await (window as any).ethereum.request({ method: 'personal_sign', params: [msgBuffer, author.address] });

  const result = await $.post(`${app.serverUrl()}/snapshotAPI/sendMessage`, { ...msg });

  if (result.status === 'Failure') {
    mixpanel.track('Create Snapshot Proposal', {
      'Step No': 2,
      'Step' : 'Incorrect Proposal',
    });

    const errorMessage =      result && result.message.error_description
      ? `${result.message.error_description}`
      : NewThreadErrors.SomethingWentWrong;
    throw new Error(errorMessage);
  } else if (result.status === 'Success') {
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
  members: string[],
  userScore: any,
  isFromExistingProposal: boolean,
  initialized: boolean,
  snapshotScoresFetched: boolean,
}> = {
  view: (vnode) => {
    if (!app.community && !app.chain) return;

    const pathVars = m.parsePathname(window.location.href);

    const votingSystemChoices = [
      ['Single choice voting', 'Each voter may select only one choice.'],
      ['Approval voting', 'Each voter may select any number of choices.'],
      ['Quadratic voting', 'Each voter may spread voting power across any number of choices. Results are calculated quaratically.'],
      ['Ranked choice voting', 'Each voter may select and rank any number of choices. Results are calculted by instant-runoff counting method.'],
      ['Weighted voting', 'Each voter may spread voting power across any number of choices.'],
    ];

    if (!app.snapshot.spaces) return;
    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      vnode.state.space = {};
      vnode.state.members = [];
      vnode.state.userScore = null;
      vnode.state.form = {
        name: '',
        body: '',
        choices: ['', ''],
        start: '',
        end: '',
        snapshot: 0,
        metadata: {},
        type: 'single-choice'
      };

      if (pathVars.params.fromProposalType && pathVars.params.fromProposalId) {
        const fromProposal = idToProposal(pathVars.params.fromProposalType, pathVars.params.fromProposalId);
        vnode.state.form.name = fromProposal.title;
        vnode.state.isFromExistingProposal = true;
        if (fromProposal.body) {
          try {
            const parsedBody = JSON.parse(fromProposal.body);
            vnode.state.form.body = parsedBody.ops[0].insert;
          } catch (e) {
            console.error(e);
          }
        }
      }
      const space = app.snapshot.spaces[vnode.attrs.snapshotId];

      snapshotJs.utils.getScores(
        space.key,
        space.strategies,
        space.network,
        snapshotJs.utils.getProvider(space.network),
        [app.user.activeAccount.address]
      ).then((response) => {
        const scores = response
          .map((score) => Object.values(score).reduce((a, b) => (a as number) + (b as number), 0))
          .reduce((a, b) => (a as number) + (b as number), 0);
        vnode.state.userScore = scores as number;
        vnode.state.space = space;
        vnode.state.members = space.members;
        vnode.state.snapshotScoresFetched = true;
        m.redraw();
      });
    }
    if (!vnode.state.snapshotScoresFetched) return;
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

    const hasMinScore = vnode.state.userScore >= vnode.state.space.filters?.minScore;

    const showScoreWarning = vnode.state.space.filters?.minScore > 0 && !hasMinScore && !isMember && vnode.state.userScore !== null;

    const isValid = vnode.state.space !== undefined
      && (!vnode.state.space.filters?.onlyMembers
        || (vnode.state.space.filters?.onlyMembers && isMember))
        && (vnode.state.space.filters?.minScore === 0
          || (vnode.state.space.filters?.minScore > 0 && vnode.state.userScore)
          || isMember);

    return m('.create-snapshot-proposal', [
      vnode.state.space.filters?.onlyMembers && !isMember
        && m(Callout, {
          class: 'no-profile-callout',
          intent: 'primary',
          content: [
            'You need to be a member of the space in order to submit a proposal.',
          ],
        }),
      // showScoreWarning
      //   ? m(Callout, {
      //     class: 'no-profile-callout',
      //     intent: 'primary',
      //     content: [
      //       `You need to have a minimum of ${vnode.state.space.filters.minScore}
      //        ${vnode.state.space.symbol} in order to submit a proposal`
      //     ],
      //   }) : m(Spinner, { active: true, }),
      m(Form, [
        m('.title', 'Main Info'),
        m(FormGroup, [
          m(FormLabel, 'Title'),
          m(Input, {
            placeholder: 'Enter the proposal title',
            oninput: (e) => {
              e.redraw = false; // do not redraw on input
              const { value } = e.target as any;
              vnode.state.form.name = value;
              localStorage.setItem(`${app.activeId()}-new-snapshot-proposal-name`, vnode.state.form.name);
            },
            defaultValue: vnode.state.form.name,
          }),
        ]),
        m(FormGroup, [
          m(FormLabel, 'Description'),
          m(QuillEditor, {
            contentsDoc: vnode.state.form.body
              ? vnode.state.form.body : ' ', // Prevent the editor from being filled in with previous content
            oncreateBind: (state) => {
              vnode.state.quillEditorState = state;
            },
            placeholder: 'What is your proposal?',
            editorNamespace: 'new-proposal',
          })
        ]),
      ]),
      m('.title .mt-56 .mb-16', 'Choices'),
      vnode.state.form.choices.map((choice, index) =>  m('.choice', {
        key:`${index}${choice}`,
      }, [
        m('.title .mr-18 .w-1-ch .mt-6', index + 1),
        m(Input, {
          class:'choice-input',
          placeholder: 'Enter choice',
          oninput: (e) => {
            e.redraw = false;
            const { value } = e.target as any;
            vnode.state.form.choices[index] = value;
          },
          defaultValue: choice,
        }),
        m('img', {
          class:'close-icon',
          src: '/static/img/close.svg',
          alt: 'Close icon',
          onclick:() => { vnode.state.form.choices.splice(index, 1); }
        })
      ])),
      m(Button, {
        class:'primary-button',
        label:'Add choice',
        onclick:() => { vnode.state.form.choices.push(''); }
      }),
      m('.title .mt-120 .mb-16', 'Voting System'),
      votingSystemChoices.map((choice) => m(Radio, {
        label:[
          m('.vote-system-title', choice[0]),
          m('.vote-system-subtitle', choice[1]),
        ],
        checked: vnode.state.form.type === choice[0],
        onchange:(e) => { vnode.state.form.type = choice[0]; },
      })),
      m('.title .mt-56 .mb-16', 'Start Date'),
      m(RadioGroup, {
        class:'date-selector',
        options:[
          moment().add(3, 'days').format('lll'),
          moment().add(7, 'days').format('lll'),
          moment().add(14, 'days').format('lll'),
          moment().add(28, 'days').format('lll'),
        ],
        value: vnode.state.form.start,
        onchange:(e) => { vnode.state.form.start = (e.currentTarget as HTMLInputElement).value; },
      }),
      m('.title .mt-56 .mb-16', 'End Date'),
      m(RadioGroup, {
        class:'date-selector',
        options:[
          moment().add(3, 'days').format('lll'),
          moment().add(7, 'days').format('lll'),
          moment().add(14, 'days').format('lll'),
          moment().add(28, 'days').format('lll'),
        ],
        value: vnode.state.form.end,
        onchange:(e) => { vnode.state.form.end = (e.currentTarget as HTMLInputElement).value; },
      }),
      m(Button, {
        class:'primary-button mt-56',
        label:'Publish',
        disabled: !author || vnode.state.saving || !isValid,
        onclick: async (e) => {
          vnode.state.saving = true;
          try {
            await newLink(vnode.state.form,
              vnode.state.quillEditorState,
              author,
              vnode.state.space,
              vnode.attrs.snapshotId);

            vnode.state.saving = false;
            clearLocalStorage();
          } catch (err) {
            vnode.state.saving = false;
            notifyError(capitalize(err.message));
          }
        },
      }),
    ]);
  }
};

export default NewProposalForm;
