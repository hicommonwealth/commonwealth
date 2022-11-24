/* eslint-disable @typescript-eslint/ban-types */
import 'pages/new_proposal_page.scss';

import m from 'mithril';
import ClassComponent from 'class_component';
import {
  Input,
  Form,
  FormLabel,
  FormGroup,
  Button,
  Callout,
  RadioGroup,
  Icon,
  Icons,
} from 'construct-ui';

import moment from 'moment';
import app from 'state';
import { navigateToSubpage } from 'app';

import { ChainBase } from 'common-common/src/types';
import { Account } from 'models';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { idToProposal } from 'identifiers';
import { capitalize } from 'lodash';
import {
  SnapshotSpace,
  getScore,
  getSpaceBlockNumber,
  getVersion,
  createProposal,
} from 'helpers/snapshot_utils';
import { QuillEditor } from '../../components/quill/quill_editor';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';

// TODO Graham 7-20-22: Reconcile against NewThreadForm
type IThreadForm = {
  name: string;
  body: string;
  choices: string[];
  range: string;
  start: number;
  end: number;
  snapshot: number;
  metadata: {
    network?: string;
    strategies?: {
      name: string;
      params: any;
    }[];
  };
  type: string;
}

enum NewThreadErrors {
  NoBody = 'Proposal body cannot be blank!',
  NoTitle = 'Title cannot be blank!',
  NoChoices = 'Choices cannot be blank!',
  NoStartDate = 'Start Date cannot be blank!',
  NoEndDate = 'End Date cannot be blank!',
  SomethingWentWrong = 'Something went wrong!',
}

// Don't call it a new thread if it ain't a new thread.
const newThread = async (
  form: IThreadForm,
  quillEditorState: QuillEditor,
  author: Account,
  space: SnapshotSpace,
  snapshotId: string
) => {
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

  if (quillEditorState.isBlank()) {
    throw new Error(NewThreadErrors.NoBody);
  }

  quillEditorState.disable();

  const bodyText = quillEditorState.textContentsAsString;

  form.body = bodyText;

  form.snapshot = await getSpaceBlockNumber(space.network);
  form.metadata.network = space.network;
  form.metadata.strategies = space.strategies;

  // Format form for proper validation
  delete form.range;
  form.start = Math.floor(form.start / 1000);
  form.end = Math.floor(form.end / 1000);

  const proposalPayload = {
    space: space.id,
    type: 'single-choice',
    title: form.name,
    body: form.body,
    choices: form.choices,
    start: form.start,
    end: form.end,
    snapshot: form.snapshot,
    network: '1', // TODO: unclear if this is always 1
    timestamp: Math.floor(Date.now() / 1e3),
    strategies: JSON.stringify({}),
    plugins: JSON.stringify({}),
    metadata: JSON.stringify({}),
  };

  try {
    await createProposal(author.address, proposalPayload);
    await app.user.notifications.refresh();
    await app.snapshot.refreshProposals();
  } catch (e) {
    console.log(e);
    throw new Error(e.error);
  }
};

const newLink = async (
  form: IThreadForm,
  quillEditorState: QuillEditor,
  author: Account,
  space: SnapshotSpace,
  snapshotId: string
) => {
  const errors = await newThread(
    form,
    quillEditorState,
    author,
    space,
    snapshotId
  );
  console.log('the rro', errors);
  return errors;
};

class NewProposalForm extends ClassComponent<
  { snapshotId: string }
> {
  private form: IThreadForm;
  private quillEditorState: QuillEditor;
  private saving: boolean;
  private space: SnapshotSpace;
  private members: string[];
  private userScore: number;
  private isFromExistingProposal: boolean;
  private initialized: boolean;
  private snapshotScoresFetched: boolean;

  public view(vnode) {
    const getLoadingPage = () =>
      m('.topic-loading-spinner-wrap', [m(CWSpinner, { size: 'large' })]);
    if (!app.chain) return getLoadingPage();

    const pathVars = m.parsePathname(window.location.href);

    if (!app.snapshot.initialized) {
      app.snapshot.init(vnode.attrs.snapshotId).then(() => m.redraw());
      return getLoadingPage();
    }
    if (!this.initialized) {
      this.initialized = true;
      this.members = [];
      this.userScore = null;
      this.form = {
        name: '',
        body: '',
        choices: ['Yes', 'No'],
        range: '5d',
        start: new Date().getTime(),
        end: moment().add(5, 'days').toDate().getTime(),
        snapshot: 0,
        metadata: {},
        type: 'single-choice',
      };

      if (pathVars.params.fromProposalType && pathVars.params.fromProposalId) {
        const fromProposalId =
          typeof pathVars.params.fromProposalId === 'number'
            ? pathVars.params.fromProposalId
            : pathVars.params.fromProposalId.toString();
        const fromProposalType = pathVars.params.fromProposalType.toString();
        const fromProposal = idToProposal(fromProposalType, fromProposalId);
        this.form.name = fromProposal.title;
        this.isFromExistingProposal = true;
        if (fromProposal.body) {
          try {
            const parsedBody = JSON.parse(fromProposal.body);
            this.form.body = parsedBody.ops[0].insert;
          } catch (e) {
            console.error(e);
          }
        }
      }
      const space = app.snapshot.space;

      getScore(space, app.user.activeAccount.address).then((response) => {
        const scores = response
          .map((score) =>
            Object.values(score).reduce(
              (a, b) => (a as number) + (b as number),
              0
            )
          )
          .reduce((a, b) => (a as number) + (b as number), 0);
        this.userScore = scores as number;
        this.space = space;
        this.members = space.members;
        this.snapshotScoresFetched = true;
        m.redraw();
      });
    }
    if (!this.snapshotScoresFetched) return getLoadingPage();
    const author = app.user.activeAccount;

    const saveToLocalStorage = () => {
      localStorage.setItem(
        `${app.activeChainId()}-new-snapshot-proposal-name`,
        this.form.name
      );
    };

    const populateFromLocalStorage = () => {
      this.form.name = localStorage.getItem(
        `${app.activeChainId()}-new-snapshot-proposal-name`
      );
    };

    const clearLocalStorage = () => {
      localStorage.removeItem(
        `${app.activeChainId()}-new-snapshot-proposal-name`
      );
    };

    const isMember =
      author &&
      author.address &&
      !!this.members.find(
        (member) => member.toLowerCase() === author.address.toLowerCase()
      );

    const hasMinScore =
      this.userScore > this.space.filters?.minScore;

    const showScoreWarning =
      this.space.filters?.minScore > 0 &&
      !hasMinScore &&
      !isMember &&
      this.userScore !== null;

    const isValid =
      this.space !== undefined &&
      (!this.space.filters?.onlyMembers ||
        (this.space.filters?.onlyMembers && isMember)) &&
      (this.space.filters?.minScore === 0 ||
        (this.space.filters?.minScore > 0 &&
          this.userScore > this.space.filters?.minScore) ||
        isMember);

    const today = new Date();
    const nextWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 7
    );
    return m(
      '.NewThreadForm',
      {
        oncreate: (vvnode) => {
          // $(vvnode.dom).find('.cui-input input').prop('autocomplete', 'off').focus();
        },
      },
      [
        m('.new-thread-form-body', [
          this.space.filters?.onlyMembers &&
            !isMember &&
            m(Callout, {
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
                  `You need to have a minimum of ${this.space.filters.minScore} ${this.space.symbol} in order to submit a proposal`,
                ],
              })
            : m(CWSpinner),
          m('.new-snapshot-proposal-form', [
            m(Form, { style: 'width:100%' }, [
              m(FormGroup, [
                m(FormLabel, 'Question/Proposal'),
                m(Input, {
                  placeholder: 'Should 0xMaki be our new Mayor?',
                  oninput: (e) => {
                    e.redraw = false; // do not redraw on input
                    const { value } = e.target as any;
                    this.form.name = value;
                    localStorage.setItem(
                      `${app.activeChainId()}-new-snapshot-proposal-name`,
                      this.form.name
                    );
                  },
                  defaultValue: this.form.name,
                }),
              ]),
              m(
                FormGroup,
                this.form.choices.map((choice, idx) => {
                  const placeholder =
                    idx === 0 ? 'Yes' : idx === 1 ? 'No' : `Option ${idx + 1}`;
                  return m(FormGroup, [
                    m(FormLabel, `Choice ${idx + 1}`),
                    m(Input, {
                      name: 'targets',
                      placeholder,
                      oninput: (e) => {
                        const result = (e.target as any).value;
                        this.form.choices[idx] = result;
                        m.redraw();
                      },
                      contentRight:
                        idx > 1 &&
                        idx === this.form.choices.length - 1 &&
                        m(CWIconButton, {
                          iconName: 'trash',
                          iconSize: 'large',
                          onclick: () => {
                            this.form.choices.pop();
                            m.redraw();
                          },
                        }),
                    }),
                  ]);
                })
              ),
              m(
                '.add-vote-choice',
                {
                  style: 'cursor: pointer;',
                  onclick: () => {
                    const choiceLength = this.form.choices.length;
                    this.form.choices.push(`Option ${choiceLength + 1}`);
                    m.redraw();
                  },
                },
                [
                  m('span', 'Add voting choice'),
                  m(Icon, {
                    name: Icons.PLUS,
                    size: 'xl',
                  }),
                ]
              ),
              m(FormGroup, [
                m(FormLabel, { for: 'period' }, 'Date Range:'),
                m(RadioGroup, {
                  name: 'period',
                  options: [{ value: '4d', label: '4-day' }],
                  value: this.form.range,
                  onchange: (e: Event) => {
                    this.form.range = (e.target as any).value;
                    this.form.start = new Date().getTime();
                    switch (this.form.range) {
                      case '4d':
                        this.form.end = moment()
                          .add(4, 'days')
                          .toDate()
                          .getTime();
                        break;
                      default:
                        break;
                    }
                  },
                }),
              ]),
              m(FormGroup, {}, [
                m(QuillEditorComponent, {
                  contentsDoc: this.form.body || ' ',
                  oncreateBind: (state: QuillEditor) => {
                    this.quillEditorState = state;
                  },
                  placeholder: 'What is your proposal?',
                  editorNamespace: 'new-proposal',
                }),
              ]),
              m(FormGroup, { order: 5 }, [
                m(Button, {
                  intent: 'primary',
                  label: 'Publish',
                  name: 'submit',
                  disabled: !author || this.saving || !isValid,
                  rounded: true,
                  onclick: async (e) => {
                    this.saving = true;
                    try {
                      await newLink(
                        this.form,
                        this.quillEditorState,
                        author,
                        this.space,
                        vnode.attrs.snapshotId
                      );
                      this.saving = false;
                      clearLocalStorage();
                      notifySuccess('Snapshot Created!');
                      navigateToSubpage(`/snapshot/${this.space.id}`);
                    } catch (err) {
                      this.saving = false;
                      notifyError(capitalize(err.message));
                    }
                  },
                }),
              ]),
            ]),
          ]),
        ]),
      ]
    );
  },
};

export default NewProposalForm;
