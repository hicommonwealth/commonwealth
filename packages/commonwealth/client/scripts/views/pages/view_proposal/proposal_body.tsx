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
import { ProposalPageState } from './types';
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
  ProposalTitleEditor,
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

type ProposalBodyAttrs = {
  commentCount: number;
  comments: Array<Comment<Thread>>;
  isAdminOrMod: boolean;
  isAuthor: boolean;
  isEditor: boolean;
  isGloballyEditing: boolean;
  proposal: AnyProposal | Thread;
  proposalPageState: ProposalPageState;
  setIsGloballyEditing: (status: boolean) => void;
  updatedCommentsCallback: () => void;
  viewCount: number;
};

export class ProposalBody implements m.ClassComponent<ProposalBodyAttrs> {
  private isEditingBody: boolean;
  private savedEdits: string;
  private shouldRestoreEdits: boolean;

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
      proposalPageState,
      viewCount,
    } = vnode.attrs;

    const setIsEditingBody = (status: boolean) => {
      setIsGloballyEditing(status);
      this.isEditingBody = status;
    };

    const hasBody = !!(proposal as AnyProposal).description;

    const hasEditPerms = isAuthor || isAdminOrMod || isEditor;

    const canComment =
      app.user.activeAccount ||
      (!isAdminOrMod &&
        TopicGateCheck.isGatedTopic(
          proposal instanceof Thread ? proposal?.topic?.name : null
        ));

    return (
      <div class="ProposalBody">
        <div class="header">
          {this.isEditingBody ? (
            <ProposalTitleEditor
              item={proposal}
              setIsGloballyEditing={setIsGloballyEditing}
              parentState={this}
            />
          ) : (
            <CWText type="h3" fontWeight="semiBold">
              {proposal.title}
            </CWText>
          )}
          <div class="info-and-menu-row">
            {proposal instanceof Thread && proposal.readOnly && (
              <CWIcon iconName="lock" iconSize="small" />
            )}
            <ProposalBodyAuthor item={proposal} />
            <CWText type="caption" className="header-text">
              published on {moment(proposal.createdAt).format('l')}
            </CWText>
            {proposal.stage !== ThreadStage.Discussion && (
              <ProposalHeaderStage proposal={proposal} />
            )}
            <CWText type="caption" className="header-text">
              {pluralize(viewCount, 'view')}
            </CWText>
            {app.isLoggedIn() && hasEditPerms && !isGloballyEditing && (
              <CWPopoverMenu
                popoverMenuItems={[
                  ...(hasEditPerms && !proposal.readOnly
                    ? [
                        {
                          label: 'Edit',
                          iconName: 'edit',
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
                          iconName: 'edit',
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
                          iconName: 'edit',
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

                            const confirmed = await confirmationModalWithText(
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
                  app.chain?.meta.snapshot.length > 0
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
                              navigateToSubpage(`/snapshot/${snapshotSpaces}`);
                            }
                          },
                        },
                      ]
                    : []),
                  ...(isAuthor || isAdminOrMod ? [{ type: 'divider' }] : []),
                  ...(isAuthor || isAdminOrMod
                    ? [getThreadSubScriptionMenuItem(proposal)]
                    : []),
                ]}
                trigger={
                  <CWIconButton iconName="chevronDown" iconSize="small" />
                }
              />
            )}
            <SocialSharingCarat />
          </div>
        </div>
        <CWDivider />
        {proposal instanceof Thread && (
          <div class="proposal-content">
            {this.isEditingBody ? (
              <EditBody
                thread={proposal}
                savedEdits={this.savedEdits}
                shouldRestoreEdits={this.shouldRestoreEdits}
                setIsEditing={setIsEditingBody}
                proposalPageState={proposalPageState}
                updatedTitle={proposal.title}
              />
            ) : (
              <>
                <ProposalBodyText item={proposal} />
                {proposal instanceof Thread && proposal.readOnly ? (
                  <CWText type="h5" className="callout-text">
                    Commenting is disabled because this post has been locked.
                  </CWText>
                ) : !isGloballyEditing && canComment ? (
                  <CreateComment
                    updatedCommentsCallback={updatedCommentsCallback}
                    setIsGloballyEditing={setIsGloballyEditing}
                    isGloballyEditing={isGloballyEditing}
                    proposalPageState={this}
                    parentComment={null}
                    rootProposal={proposal}
                  />
                ) : null}
              </>
            )}
          </div>
        )}

        {!(proposal instanceof Thread) && (
          <>
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
        <div class="comments-count">
          <CWIcon iconName="feedback" iconSize="small" />
          <CWText type="caption">{commentCount} Comments</CWText>
        </div>
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

// just for proposals?
//
// <CWText
//         className={`onchain-status-text ${getStatusClass(proposal)}`}
//       >
//         {getStatusText(proposal)}
//       </CWText>
// <div class="proposal-body-link">
//       {!(proposal instanceof Thread) &&
//         (proposal['blockExplorerLink'] ||
//           proposal['votingInterfaceLink'] ||
//           proposal.threadId) && (
//           <div class="proposal-body-link">
//             {proposal.threadId && (
//               <ProposalHeaderThreadLink proposal={proposal} />
//             )}
//             {proposal['blockExplorerLink'] && (
//               <ProposalHeaderBlockExplorerLink proposal={proposal} />
//             )}
//             {proposal['votingInterfaceLink'] && (
//               <ProposalHeaderVotingInterfaceLink
//                 proposal={proposal}
//               />
//             )}
//           </div>
//         )}
//     </div>
