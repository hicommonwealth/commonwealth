/* @jsx m */

import { navigateToSubpage } from 'router';
import ClassComponent from 'class_component';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type { SnapshotSpace } from 'helpers/snapshot_utils';
import { getScore } from 'helpers/snapshot_utils';
import { idToProposal } from 'identifiers';
import { capitalize } from 'lodash';
import m from 'mithril';
import moment from 'moment';

import 'pages/new_snapshot_proposal.scss';

import app from 'state';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import type { QuillEditor } from '../../components/quill/quill_editor';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';
import { newLink } from './helpers';
import type { ThreadForm } from './types';

type NewSnapshotProposalPageAttrs = {
  snapshotId: string;
};

export class NewSnapshotProposalPage extends ClassComponent<NewSnapshotProposalPageAttrs> {
  private form: ThreadForm;
  private initialized: boolean;
  private isFromExistingProposal: boolean;
  private members: Array<string>;
  private quillEditorState: QuillEditor;
  private saving: boolean;
  private snapshotScoresFetched: boolean;
  private space: SnapshotSpace;
  private userScore: number;

  view(vnode: m.Vnode<NewSnapshotProposalPageAttrs>) {
    if (!app.chain) {
      return <PageLoading />;
    }

    const pathVars = m.parsePathname(window.location.href);

    if (!app.snapshot.initialized) {
      app.snapshot.init(vnode.attrs.snapshotId).then(() => m.redraw());
      return <PageLoading />;
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

    if (!this.snapshotScoresFetched) return <PageLoading />;

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

    const minScoreFromSpace =
      this.space.validation?.params.minScore ?? this.space.filters?.minScore; // Fall back to filters

    const hasMinScore = this.userScore >= minScoreFromSpace;

    const showScoreWarning =
      minScoreFromSpace > 0 &&
      !hasMinScore &&
      !isMember &&
      this.userScore !== null;

    const isValid =
      this.space !== undefined &&
      (!this.space.filters?.onlyMembers ||
        (this.space.filters?.onlyMembers && isMember)) &&
      (minScoreFromSpace === 0 ||
        (minScoreFromSpace > 0 && this.userScore > minScoreFromSpace) ||
        isMember);

    return (
      <Sublayout>
        <div class="NewSnapshotProposalPage">
          <CWText type="h3" fontWeight="medium">
            New Snapshot Proposal
          </CWText>
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
          <CWTextInput
            label="Question/Proposal"
            placeholder="Should 0xMaki be our new Mayor?"
            oninput={(e) => {
              e.redraw = false; // do not redraw on input

              this.form.name = e.target.value as any;

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
          <CWButton
            iconLeft="plus"
            label="Add voting choice"
            onclick={() => {
              this.form.choices.push(`Option ${this.form.choices.length + 1}`);
              m.redraw();
            }}
          />
          <QuillEditorComponent
            contentsDoc={this.form.body || ' '}
            oncreateBind={(state: QuillEditor) => {
              this.quillEditorState = state;
            }}
            placeholder="What is your proposal?"
            editorNamespace="new-proposal"
            mode="markdown"
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
      </Sublayout>
    );
  }
}

export default NewSnapshotProposalPage;
