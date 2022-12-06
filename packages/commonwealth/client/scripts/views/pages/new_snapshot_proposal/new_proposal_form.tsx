import m from 'mithril';
import ClassComponent from 'client/scripts/class_component';
import moment from 'moment';

import 'pages/new_proposal_page.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { Account } from 'models';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { idToProposal } from 'identifiers';
import { capitalize } from 'lodash';
import {
  SnapshotSpace,
  getScore,
  getSpaceBlockNumber,
  createProposal,
} from 'helpers/snapshot_utils';
import { QuillEditor } from '../../components/quill/quill_editor';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';

// TODO Graham 7-20-22: Reconcile against NewThreadForm
type ThreadForm = {
  body: string;
  choices: Array<string>;
  end: number;
  metadata: {
    network?: string;
    strategies?: Array<{
      name: string;
      params: any;
    }>;
  };
  name: string;
  range: string;
  snapshot: number;
  start: number;
  type: string;
};

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
  form: ThreadForm,
  quillEditorState: QuillEditor,
  author: Account,
  space: SnapshotSpace
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
  form: ThreadForm,
  quillEditorState: QuillEditor,
  author: Account,
  space: SnapshotSpace
) => {
  const errors = await newThread(form, quillEditorState, author, space);
  console.log('the rro', errors);
  return errors;
};

type NewProposalFormAttrs = {
  snapshotId: string;
};

export class NewProposalForm extends ClassComponent<NewProposalFormAttrs> {
  private form: ThreadForm;
  private initialized: boolean;
  private isFromExistingProposal: boolean;
  private members: string[];
  private quillEditorState: QuillEditor;
  private saving: boolean;
  private snapshotScoresFetched: boolean;
  private space: SnapshotSpace;
  private userScore: number;

  view(vnode: m.Vnode<NewProposalFormAttrs>) {
    const getLoadingPage = () => (
      <div class="topic-loading-spinner-wrap">
        <CWSpinner size="large" />
      </div>
    );

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

    const hasMinScore = this.userScore >= this.space.filters?.minScore;

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

    return (
      <div class="NewThreadForm">
        <div class="new-thread-form-body">
          {this.space.filters?.onlyMembers && !isMember && (
            <CWText>
              You need to be a member of the space in order to submit a
              proposal.
            </CWText>
          )}
          {showScoreWarning ? (
            <CWText>
              You need to have a minimum of {this.space.filters.minScore}{' '}
              {this.space.symbol} in order to submit a proposal.
            </CWText>
          ) : (
            <CWSpinner />
          )}
          <div class="new-snapshot-proposal-form">
            <CWTextInput
              label="Question/Proposal"
              placeholder="Should 0xMaki be our new Mayor?"
              oninput={(e) => {
                e.redraw = false; // do not redraw on input

                this.form.name = e.target as any;

                localStorage.setItem(
                  `${app.activeChainId()}-new-snapshot-proposal-name`,
                  this.form.name
                );
              }}
              defaultValue={this.form.name}
            />
            {this.form.choices.map((_, idx) => {
              return (
                <CWTextInput
                  label={`Choice ${idx + 1}`}
                  placeholder={
                    idx === 0 ? 'Yes' : idx === 1 ? 'No' : `Option ${idx + 1}`
                  }
                  oninput={(e) => {
                    this.form.choices[idx] = (e.target as any).value;
                    m.redraw();
                  }}
                  iconRight={
                    idx > 1 && idx === this.form.choices.length - 1
                      ? 'trash'
                      : undefined
                  }
                  iconRightonclick={() => {
                    this.form.choices.pop();
                    m.redraw();
                  }}
                />
              );
            })}
            <div
              class="add-vote-choice"
              style="cursor: pointer;"
              onclick={() => {
                this.form.choices.push(
                  `Option ${this.form.choices.length + 1}`
                );
                m.redraw();
              }}
            >
              <span>Add voting choice</span>
              <CWIcon iconName="plus" size="xl" />
            </div>
            <CWLabel label="Date Range:" />
            <CWRadioGroup
              name="period"
              options={[{ value: '4d', label: '4-day' }]}
              value={this.form.range}
              onchange={(e: Event) => {
                this.form.range = (e.target as any).value;
                this.form.start = new Date().getTime();
                switch (this.form.range) {
                  case '4d':
                    this.form.end = moment().add(4, 'days').toDate().getTime();
                    break;
                  default:
                    break;
                }
              }}
            />
            <QuillEditorComponent
              contentsDoc={this.form.body || ' '}
              oncreateBind={(state: QuillEditor) => {
                this.quillEditorState = state;
              }}
              placeholder="What is your proposal?"
              editorNamespace="new-proposal"
            />
            <CWButton
              label="Publish"
              disabled={!author || this.saving || !isValid}
              onclick={async () => {
                this.saving = true;

                try {
                  await newLink(
                    this.form,
                    this.quillEditorState,
                    author,
                    this.space
                  );

                  this.saving = false;

                  clearLocalStorage();

                  notifySuccess('Snapshot Created!');

                  navigateToSubpage(`/snapshot/${this.space.id}`);
                } catch (err) {
                  this.saving = false;

                  notifyError(capitalize(err.message));
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}
