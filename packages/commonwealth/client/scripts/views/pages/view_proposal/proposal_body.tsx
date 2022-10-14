/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/view_proposal/proposal_body.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { AnyProposal, Comment, Thread, ThreadStage, Topic } from 'models';
import { pluralize } from 'helpers';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { ContentType } from 'types';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { LinkedProposalsEmbed } from './linked_proposals_embed';
import { AaveViewProposalDetail } from './aave_summary';
import { VotingResults } from '../../components/proposals/voting_results';
import { VotingActions } from '../../components/proposals/voting_actions';
import { ProposalComments } from './proposal_comments';
import { CreateComment } from './create_comment';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { clearEditingLocalStorage } from './helpers';
import {
  QueueButton,
  ExecuteButton,
  CancelButton,
} from '../../components/proposals/voting_actions_components';
import {
  ProposalBodyAuthor,
  ProposalBodyText,
  ProposalHeaderStage,
} from './proposal_components';
import { SocialSharingCarat } from './social_sharing_carat';
import { getThreadSubScriptionMenuItem } from '../discussions/discussion_row_menu';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { EditCollaboratorsModal } from '../../modals/edit_collaborators_modal';
import { ChangeTopicModal } from '../../modals/change_topic_modal';
import { EditBody } from './edit_body';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  getStatusClass,
  getStatusText,
} from '../../components/proposal_card/helpers';
import {
  ProposalHeaderBlockExplorerLink,
  ProposalHeaderExternalLink,
  ProposalHeaderThreadLink,
  ProposalHeaderVotingInterfaceLink,
} from './proposal_header_links';
import { ThreadReactionButton } from '../../components/reaction_button/thread_reaction_button';

type ProposalBodyAttrs = {
  commentCount: number;
  comments: Array<Comment<Thread>>;
  isAdminOrMod: boolean;
  isAuthor: boolean;
  isEditor: boolean;
  isGloballyEditing: boolean;
  proposal: AnyProposal | Thread;
  setIsGloballyEditing: (status: boolean) => void;
  updatedCommentsCallback: () => void;
  viewCount: number;
};

export class ProposalBody implements m.ClassComponent<ProposalBodyAttrs> {
  private isEditingBody: boolean;
  private savedEdits: string;
  private shouldRestoreEdits: boolean;
  private title: string;

  oninit(vnode) {
    this.title = vnode.attrs.proposal.title;
  }

  view(vnode) {
    const {
      commentCount,
      comments,
      updatedCommentsCallback,
      setIsGloballyEditing,
      isAdminOrMod,
      isAuthor,
      isEditor,
      isGloballyEditing,
      proposal,
      viewCount,
    } = vnode.attrs;

    const setIsEditingBody = (status: boolean) => {
      setIsGloballyEditing(status);
      this.isEditingBody = status;
    };

    const hasBody = !!(proposal as AnyProposal).description;
    const hasLink = !!(proposal as Thread).url;

    const hasEditPerms = isAuthor || isAdminOrMod || isEditor;

    const canComment =
      app.user.activeAccount ||
      (!isAdminOrMod &&
        TopicGateCheck.isGatedTopic(
          proposal instanceof Thread ? proposal?.topic?.name : null
        ));

    const reactionsAndReplyButtons = (
      <div class="thread-footer-row">
        <ThreadReactionButton thread={proposal} />
        <div class="comments-count">
          <CWIcon iconName="feedback" iconSize="small" />
          <CWText type="caption">{commentCount} Comments</CWText>
        </div>
      </div>
    );

    return (
      <div class="ProposalBody">
        <div class="header">
          {/* threads */}
          {this.isEditingBody ? (
            <CWTextInput
              oninput={(e) => {
                this.title = e.target.value;
              }}
              value={this.title}
            />
          ) : (
            <CWText type="h3" fontWeight="semiBold">
              {proposal.title}
            </CWText>
          )}
          <div class="info-and-menu-row">
            {/* shared */}
            <ProposalBodyAuthor item={proposal} />
            <CWText type="caption" className="header-text">
              published on {moment(proposal.createdAt).format('l')}
            </CWText>
            <CWText type="caption" className="header-text">
              {pluralize(viewCount, 'view')}
            </CWText>

            {/* threads */}
            {proposal instanceof Thread && proposal.readOnly && (
              <CWIcon iconName="lock" iconSize="small" />
            )}
            {proposal instanceof Thread &&
              proposal.stage !== ThreadStage.Discussion && (
                <ProposalHeaderStage proposal={proposal} />
              )}
            {app.isLoggedIn() &&
              proposal instanceof Thread &&
              hasEditPerms &&
              !isGloballyEditing && (
                <>
                  <CWPopoverMenu
                    menuItems={[
                      ...(hasEditPerms && !proposal.readOnly
                        ? [
                            {
                              label: 'Edit',
                              iconName: 'write',
                              onclick: async (e) => {
                                e.preventDefault();
                                this.savedEdits = localStorage.getItem(
                                  `${app.activeChainId()}-edit-thread-${
                                    proposal.id
                                  }-storedText`
                                );
                                if (this.savedEdits) {
                                  clearEditingLocalStorage(
                                    proposal.id,
                                    ContentType.Thread
                                  );
                                  this.shouldRestoreEdits =
                                    await confirmationModalWithText(
                                      'Previous changes found. Restore edits?',
                                      'Yes',
                                      'No'
                                    )();
                                }
                                setIsEditingBody(true);
                              },
                            },
                          ]
                        : []),
                      ...(isAuthor
                        ? [
                            {
                              label: 'Edit collaborators',
                              iconName: 'write',
                              onclick: async (e) => {
                                e.preventDefault();
                                app.modals.create({
                                  modal: EditCollaboratorsModal,
                                  data: {
                                    thread: proposal,
                                  },
                                });
                              },
                            },
                          ]
                        : []),
                      ...(isAdminOrMod
                        ? [
                            {
                              label: 'Change topic',
                              iconName: 'write',
                              onclick: (e) => {
                                e.preventDefault();
                                app.modals.create({
                                  modal: ChangeTopicModal,
                                  data: {
                                    onChangeHandler: (topic: Topic) => {
                                      proposal.topic = topic;
                                      m.redraw();
                                    },
                                    thread: proposal,
                                  },
                                });
                              },
                            },
                          ]
                        : []),
                      ...(isAuthor || isAdminOrMod || app.user.isSiteAdmin
                        ? [
                            {
                              label: 'Delete',
                              iconName: 'trash',
                              onclick: async (e) => {
                                e.preventDefault();

                                const confirmed =
                                  await confirmationModalWithText(
                                    'Delete this entire thread?'
                                  )();

                                if (!confirmed) return;

                                app.threads.delete(proposal).then(() => {
                                  navigateToSubpage('/');
                                });
                              },
                            },
                          ]
                        : []),
                      ...(isAuthor || isAdminOrMod
                        ? [
                            {
                              label: proposal.readOnly
                                ? 'Unlock thread'
                                : 'Lock thread',
                              iconName: 'lock',
                              onclick: (e) => {
                                e.preventDefault();
                                app.threads
                                  .setPrivacy({
                                    threadId: proposal.id,
                                    readOnly: !proposal.readOnly,
                                  })
                                  .then(() => {
                                    setIsEditingBody(false);
                                    m.redraw();
                                  });
                              },
                            },
                          ]
                        : []),
                      ...((isAuthor || isAdminOrMod) &&
                      !!app.chain?.meta.snapshot.length
                        ? [
                            {
                              label: 'Snapshot proposal from thread',
                              iconName: 'democraticProposal',
                              onclick: () => {
                                const snapshotSpaces = app.chain.meta.snapshot;

                                if (snapshotSpaces.length > 1) {
                                  navigateToSubpage('/multiple-snapshots', {
                                    action: 'create-from-thread',
                                    proposal,
                                  });
                                } else {
                                  navigateToSubpage(
                                    `/snapshot/${snapshotSpaces}`
                                  );
                                }
                              },
                            },
                          ]
                        : []),
                      ...(isAuthor || isAdminOrMod
                        ? [{ type: 'divider' }]
                        : []),
                      ...(isAuthor || isAdminOrMod
                        ? [getThreadSubScriptionMenuItem(proposal)]
                        : []),
                    ]}
                    trigger={
                      <CWIconButton iconName="chevronDown" iconSize="small" />
                    }
                  />
                  <SocialSharingCarat />
                </>
              )}
          </div>
        </div>
        <CWDivider />
        {hasLink && <ProposalHeaderExternalLink proposal={proposal} />}
        {proposal instanceof Thread && (
          <div class="proposal-content">
            {this.isEditingBody ? (
              <>
                {proposal instanceof Thread && reactionsAndReplyButtons}
                <EditBody
                  thread={proposal}
                  savedEdits={this.savedEdits}
                  shouldRestoreEdits={this.shouldRestoreEdits}
                  setIsEditing={setIsEditingBody}
                  title={this.title}
                />
              </>
            ) : (
              <>
                <ProposalBodyText item={proposal} />
                {proposal instanceof Thread && proposal.readOnly ? (
                  <CWText type="h5" className="callout-text">
                    Commenting is disabled because this post has been locked.
                  </CWText>
                ) : !isGloballyEditing && canComment ? (
                  <>
                    {proposal instanceof Thread && reactionsAndReplyButtons}
                    <CreateComment
                      updatedCommentsCallback={updatedCommentsCallback}
                      setIsGloballyEditing={setIsGloballyEditing}
                      isGloballyEditing={isGloballyEditing}
                      parentComment={null}
                      rootProposal={proposal}
                    />
                  </>
                ) : null}
              </>
            )}
          </div>
        )}

        {!(proposal instanceof Thread) && (
          <>
            <CWText
              className={`onchain-status-text ${getStatusClass(proposal)}`}
            >
              {getStatusText(proposal)}
            </CWText>
            {(proposal['blockExplorerLink'] ||
              proposal['votingInterfaceLink'] ||
              proposal.threadId) && (
              <div class="proposal-links">
                {proposal.threadId && (
                  <ProposalHeaderThreadLink proposal={proposal} />
                )}
                {proposal['blockExplorerLink'] && (
                  <ProposalHeaderBlockExplorerLink proposal={proposal} />
                )}
                {proposal['votingInterfaceLink'] && (
                  <ProposalHeaderVotingInterfaceLink proposal={proposal} />
                )}
              </div>
            )}
            <QueueButton proposal={proposal} />
            <ExecuteButton proposal={proposal} />
            <CancelButton proposal={proposal} />
            {hasBody && (
              <div class="proposal-content">
                <ProposalBodyText item={proposal} />
              </div>
            )}
            <LinkedProposalsEmbed proposal={proposal} />
          </>
        )}
        {proposal instanceof AaveProposal && (
          <AaveViewProposalDetail proposal={proposal} />
        )}
        {!(proposal instanceof Thread) && (
          <>
            <VotingResults proposal={proposal} />
            <VotingActions proposal={proposal} />
          </>
        )}
        <ProposalComments
          comments={comments}
          proposal={proposal}
          setIsGloballyEditing={setIsGloballyEditing}
          updatedCommentsCallback={updatedCommentsCallback}
        />
      </div>
    );
  }
}
