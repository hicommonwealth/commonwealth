import 'pages/new_proposal_page.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Input, Form, FormLabel, FormGroup, Button, Callout, Spinner, RadioGroup } from 'construct-ui';

import moment from 'moment';
import snapshotJs from '@snapshot-labs/snapshot.js';

import app from 'state';

import { Account, ChainBase } from 'models';
import { notifyError } from 'controllers/app/notifications';
import QuillEditor from 'views/components/quill_editor';
import { idToProposal } from 'identifiers';
import { capitalize } from 'lodash';
import MetamaskWebWalletController from 'controllers/app/webWallets/metamask_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import { SnapshotSpace } from 'client/scripts/helpers/snapshot_utils';

interface IThreadForm {
  name: string;
  body: string;
  choices: string[];
  range: string;
  start: number;
  end: number;
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
  author: Account<any>,
  space: SnapshotSpace,
  snapshotId: string,
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

  // TODO: do without snapshotjs
  form.snapshot = await snapshotJs.utils.getBlockNumber(snapshotJs.utils.getProvider(space.network));
  form.metadata.network = space.network;
  form.metadata.strategies = space.strategies;

  // Format form for proper validation
  delete form.range;
  form.start /= 1000;
  form.end /= 1000;

  const msg: any = {
    address: author.address,
    msg: JSON.stringify({
      version: '0.1.3',
      timestamp: (Date.now() / 1e3).toFixed(),
      space: space.id,
      type: 'proposal',
      payload: form
    })
  };

  try {
    const wallet = await app.wallets.locateWallet(author.address, ChainBase.Ethereum);
    if (!(wallet instanceof MetamaskWebWalletController
      || wallet instanceof WalletConnectWebWalletController
    )) {
      throw new Error('Invalid wallet.');
    }
    msg.sig = await wallet.signMessage(msg.msg);

    const result = await $.post(`${app.serverUrl()}/snapshotAPI/sendMessage`, { ...msg });
    if (result.status === 'Failure') {
      const errorMessage = result && result.message.error_description
        ? `${result.message.error_description}`
        : NewThreadErrors.SomethingWentWrong;
      throw new Error(errorMessage);
    } else if (result.status === 'Success') {
      await app.user.notifications.refresh();
      await app.snapshot.refreshProposals();
      m.route.set(`/${app.activeId()}/snapshot-proposal/${snapshotId}/${result.message.ipfsHash}`);
    }
  } catch (err) {
    notifyError(err.message);
  }
};

const newLink = async (form, quillEditorState, author: Account<any>, space: SnapshotSpace, snapshotId: string) => {
  const errors = await newThread(form, quillEditorState, author, space, snapshotId);
  return errors;
};

const NewProposalForm: m.Component<{snapshotId: string}, {
  form: IThreadForm,
  quillEditorState,
  saving: boolean,
  space: SnapshotSpace,
  members: string[],
  userScore: any,
  isFromExistingProposal: boolean,
  initialized: boolean,
  snapshotScoresFetched: boolean,
}> = {
  view: (vnode) => {
    const getLoadingPage = () => m('.topic-loading-spinner-wrap', [ m(Spinner, { active: true, size: 'lg' }) ]);
    if (!app.community && !app.chain) return getLoadingPage();

    const pathVars = m.parsePathname(window.location.href);

    if (!app.snapshot.initialized) {
      app.snapshot.init(vnode.attrs.snapshotId).then(() => m.redraw());
      return getLoadingPage();
    }
    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      vnode.state.members = [];
      vnode.state.userScore = null;
      vnode.state.form = {
        name: '',
        body: '',
        choices: ['Yes', 'No'],
        range: '3d',
        start: new Date().getTime(),
        end: moment().add(3, 'days').toDate().getTime(),
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
      const space = app.snapshot.space;

      snapshotJs.utils.getScores(
        space.id,
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
    if (!vnode.state.snapshotScoresFetched) return getLoadingPage();
    const author = app.user.activeAccount;
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

    const isMember = author
      && author.address
      && !!vnode.state.members.find((member) => member.toLowerCase() === author.address.toLowerCase());

    const hasMinScore = vnode.state.userScore >= vnode.state.space.filters?.minScore;

    const showScoreWarning = vnode.state.space.filters?.minScore > 0
      && !hasMinScore
      && !isMember
      && vnode.state.userScore !== null;

    const isValid = vnode.state.space !== undefined
      && (!vnode.state.space.filters?.onlyMembers
        || (vnode.state.space.filters?.onlyMembers && isMember))
        && (vnode.state.space.filters?.minScore === 0
          || (vnode.state.space.filters?.minScore > 0 && vnode.state.userScore)
          || isMember);



    const today = new Date();
    const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    return m('.NewThreadForm', {
      oncreate: (vvnode) => {
        // $(vvnode.dom).find('.cui-input input').prop('autocomplete', 'off').focus();
      },
    }, [
      m('.new-thread-form-body', [
        vnode.state.space.filters?.onlyMembers && !isMember
        && m(Callout, {
          class: 'no-profile-callout',
          intent: 'primary',
          content: [
            'You need to be a member of the space in order to submit a proposal.',
          ],
        }),
        showScoreWarning
          ? m(Callout, {
            class: 'no-profile-callout',
            intent: 'primary',
            content: [
              `You need to have a minimum of ${vnode.state.space.filters.minScore} ${vnode.state.space.symbol} in order to submit a proposal`
            ],
          }) : m(Spinner, { active: false, }),
        m('.new-snapshot-proposal-form', [
          m(Form, { style:'width:100%' }, [
            m(FormGroup, [
              m(FormLabel, 'Question/Proposal'),
              m(Input, {
                placeholder: 'Should 0xMaki be our new Mayor?',
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
            ]),
            m(FormGroup, [
              m(FormLabel, { for: 'period' }, 'Date Range:'),
              m(RadioGroup, {
                name: 'period',
                options: [
                  { value: '3d', label: '3-day' },
                  { value: '7d', label: '7-day' },
                  { value: '2w', label: '2 weeks' },
                  { value: '4w', label: '4 weeks' },
                ],
                value: vnode.state.form.range,
                onchange: (e: Event) => {
                  vnode.state.form.range = (e.target as any).value;
                  vnode.state.form.start = new Date().getTime();
                  switch (vnode.state.form.range) {
                    case '3d':
                      vnode.state.form.end = moment().add(3, 'days').toDate().getTime();
                      break;
                    case '7d':
                      vnode.state.form.end = moment().add(7, 'days').toDate().getTime();
                      break;
                    case '2w':
                      vnode.state.form.end = moment().add(2, 'weeks').toDate().getTime();
                      break;
                    case '4w':
                      vnode.state.form.end = moment().add(4, 'weeks').toDate().getTime();
                      break;
                    default:
                      break;
                  }
                },
              }),
            ]),
            m(FormGroup, [
              m(QuillEditor, {
                // Prevent the editor from being filled in with previous content
                contentsDoc: vnode.state.form.body ? vnode.state.form.body : ' ',
                oncreateBind: (state) => {
                  vnode.state.quillEditorState = state;
                },
                placeholder: 'What is your proposal?',
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
                    await newLink(
                      vnode.state.form,
                      vnode.state.quillEditorState,
                      author,
                      vnode.state.space,
                      vnode.attrs.snapshotId,
                    );
                    vnode.state.saving = false;
                    clearLocalStorage();
                  } catch (err) {
                    vnode.state.saving = false;
                    notifyError(capitalize(err.message));
                  }
                },
              }),
            ]),
          ]),
        ]),
      ]),
    ]);
  }
};

export default NewProposalForm;
