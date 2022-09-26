/* @jsx m */

import m from 'mithril';
import { PopoverMenu, MenuItem } from 'construct-ui';

import 'pages/view_proposal/proposal_header.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { Thread, ThreadKind, AnyProposal, Topic } from 'models';
import {
  ChangeTopicMenuItem,
  ThreadSubscriptionMenuItem,
} from 'views/pages/discussions/discussion_row_menu';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import { SocialSharingCarat } from 'views/components/social_sharing_carat';
import {
  ProposalHeaderTopics,
  ProposalHeaderTitle,
  ProposalHeaderStage,
  ProposalHeaderOnchainId,
  ProposalHeaderOnchainStatus,
  ProposalHeaderViewCount,
  ProposalHeaderPrivacyMenuItems,
  ProposalTitleEditor,
  ProposalTitleEditMenuItem,
  ProposalLinkEditor,
} from './proposal_header_components';
import {
  ProposalBodyAvatar,
  ProposalBodyAuthor,
  ProposalBodyCreated,
  ProposalBodyLastEdited,
  ProposalBodyCancelEdit,
  ProposalBodySaveEdit,
  ProposalBodyText,
  ProposalBodyAttachments,
  ProposalBodyEditor,
  ProposalBodyEditMenuItem,
  ProposalBodyDeleteMenuItem,
  EditCollaboratorsButton,
} from './body';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { InlineReplyButton } from '../../components/inline_reply_button';
import { ThreadReactionButton } from '../../components/reaction_button/thread_reaction_button';
import {
  ProposalHeaderExternalLink,
  ProposalHeaderThreadLink,
  ProposalHeaderBlockExplorerLink,
  ProposalHeaderVotingInterfaceLink,
} from './proposal_header_links';
import {
  QueueButton,
  ExecuteButton,
  CancelButton,
} from '../../components/proposals/voting_actions_components';
import { QuillEditor } from '../../components/quill/quill_editor';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { GlobalStatus, ProposalPageState } from './types';
import { scrollToForm } from './helpers';

export class ProposalHeader
  implements
    m.ClassComponent<{
      commentCount: number;
      viewCount: number;
      getSetGlobalEditingStatus: CallableFunction;
      proposalPageState: ProposalPageState;
      proposal: AnyProposal | Thread;
      isAuthor: boolean;
      isEditor: boolean;
      isAdmin: boolean;
    }>
{
  private currentText: any;
  private editing: boolean;
  private quillEditorState: QuillEditor;
  private savedEdit: string;
  private saving: boolean;
  private updatedTitle: string;
  private updatedUrl: string;

  view(vnode) {
    const {
      commentCount,
      proposal,
      getSetGlobalEditingStatus,
      proposalPageState,
      viewCount,
      isAuthor,
      isEditor,
      isAdmin,
    } = vnode.attrs;

    const attachments =
      proposal instanceof Thread ? (proposal as Thread).attachments : false;

    const proposalLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}`
    );

    const proposalTitleIsEditable =
      proposal instanceof SubstrateDemocracyProposal ||
      proposal instanceof SubstrateCollectiveProposal ||
      proposal instanceof SubstrateTreasuryTip ||
      proposal instanceof SubstrateTreasuryProposal;

    const hasBody = !!(proposal as AnyProposal).description;

    return (
      <div class="ProposalHeader">
        <div class="proposal-top">
          <div class="proposal-top-left">
            {!(proposal instanceof Thread) && (
              <div class="proposal-meta-top">
                <div class="proposal-meta-top-left">
                  <ProposalHeaderOnchainId proposal={proposal} />
                </div>
                <div class="proposal-meta-top-right">
                  <QueueButton proposal={proposal} />
                  <ExecuteButton proposal={proposal} />
                  <CancelButton proposal={proposal} />
                </div>
              </div>
            )}
            {!this.editing && (
              <div class="proposal-title">
                <ProposalHeaderTitle proposal={proposal} />
              </div>
            )}
            {this.editing && (
              <ProposalTitleEditor
                item={proposal}
                getSetGlobalEditingStatus={getSetGlobalEditingStatus}
                parentState={this}
              />
            )}
            <div class="proposal-body-meta">
              {proposal instanceof Thread ? (
                <>
                  <ProposalHeaderStage proposal={proposal} />
                  <ProposalHeaderTopics proposal={proposal} />
                  <ProposalBodyCreated item={proposal} link={proposalLink} />
                  <ProposalBodyLastEdited item={proposal} />
                  <ProposalBodyAuthor item={proposal} />
                  <ProposalHeaderViewCount viewCount={viewCount} />
                  {app.isLoggedIn() &&
                    !getSetGlobalEditingStatus(GlobalStatus.Get) && (
                      <PopoverMenu
                        transitionDuration={0}
                        closeOnOutsideClick
                        closeOnContentClick
                        menuAttrs={{ size: 'default' }}
                        content={
                          <>
                            {(isEditor || isAuthor || isAdmin) && (
                              <ProposalBodyEditMenuItem
                                item={proposal}
                                proposalPageState={
                                  vnode.attrs.proposalPageState
                                }
                                getSetGlobalEditingStatus={
                                  getSetGlobalEditingStatus
                                }
                                parentState={this}
                              />
                            )}
                            {isAuthor && (
                              <EditCollaboratorsButton proposal={proposal} />
                            )}
                            {isAdmin && proposal instanceof Thread && (
                              <ChangeTopicMenuItem
                                proposal={proposal}
                                onChangeHandler={(topic: Topic) => {
                                  proposal.topic = topic;
                                  m.redraw();
                                }}
                              />
                            )}
                            {(isAuthor || isAdmin || app.user.isSiteAdmin) && (
                              <ProposalBodyDeleteMenuItem item={proposal} />
                            )}
                            {(isAuthor || isAdmin) && (
                              <ProposalHeaderPrivacyMenuItems
                                proposal={proposal}
                                getSetGlobalEditingStatus={
                                  getSetGlobalEditingStatus
                                }
                              />
                            )}
                            {(isAuthor || isAdmin) &&
                              app.chain?.meta.snapshot.length > 0 && (
                                <MenuItem
                                  onclick={() => {
                                    const snapshotSpaces =
                                      app.chain.meta.snapshot;
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
                                  }}
                                  label="Snapshot proposal from thread"
                                />
                              )}
                            {(isAuthor || isAdmin) && <CWDivider />}
                            <ThreadSubscriptionMenuItem
                              proposal={proposal as Thread}
                            />
                          </>
                        }
                        trigger={
                          <div>
                            <CWIcon iconName="chevronDown" iconSize="small" />
                          </div>
                        }
                      />
                    )}
                  <SocialSharingCarat />
                </>
              ) : (
                <>
                  <ProposalBodyAuthor proposal={proposal} />
                  <ProposalHeaderOnchainStatus proposal={proposal} />
                  {app.isLoggedIn() &&
                    (isAdmin || isAuthor) &&
                    !getSetGlobalEditingStatus(GlobalStatus.Get) &&
                    proposalTitleIsEditable && (
                      <PopoverMenu
                        transitionDuration={0}
                        closeOnOutsideClick
                        closeOnContentClick
                        menuAttrs={{ size: 'default' }}
                        content={
                          <ProposalTitleEditMenuItem
                            item={proposal}
                            proposalPageState={proposalPageState}
                            getSetGlobalEditingStatus={
                              getSetGlobalEditingStatus
                            }
                            parentState={this}
                          />
                        }
                        trigger={
                          <div>
                            <CWIcon iconName="chevronDown" iconSize="small" />
                          </div>
                        }
                      />
                    )}
                </>
              )}
            </div>
            <div class="proposal-body-link">
              {proposal instanceof Thread &&
              proposal.kind === ThreadKind.Link &&
              this.editing ? (
                <ProposalLinkEditor item={proposal} parentState={this} />
              ) : (
                <ProposalHeaderExternalLink proposal={proposal} />
              )}
              {!(proposal instanceof Thread) &&
                (proposal['blockExplorerLink'] ||
                  proposal['votingInterfaceLink'] ||
                  proposal.threadId) && (
                  <div class="proposal-body-link">
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
            </div>
          </div>
        </div>
        <CWDivider />
        {proposal instanceof Thread && (
          <div class="proposal-content">
            <div class="proposal-content-left">
              <ProposalBodyAvatar item={proposal} />
            </div>
            <div class="proposal-content-right">
              {!this.editing && <ProposalBodyText item={proposal} />}
              {!this.editing && attachments && attachments.length > 0 && (
                <ProposalBodyAttachments item={proposal} />
              )}
              {this.editing && (
                <ProposalBodyEditor item={proposal} parentState={this} />
              )}
              <div class="proposal-body-bottom">
                {this.editing ? (
                  <div class="proposal-body-button-group">
                    <ProposalBodySaveEdit
                      item={proposal}
                      getSetGlobalEditingStatus={getSetGlobalEditingStatus}
                      parentState={this}
                    />
                    <ProposalBodyCancelEdit
                      item={proposal}
                      getSetGlobalEditingStatus={getSetGlobalEditingStatus}
                      parentState={this}
                    />
                  </div>
                ) : (
                  <div class="proposal-response-row">
                    <ThreadReactionButton thread={proposal} />
                    <InlineReplyButton
                      commentReplyCount={commentCount}
                      onclick={() => {
                        if (!proposalPageState.replying) {
                          proposalPageState.replying = true;
                          scrollToForm();
                        } else if (!proposalPageState.parentCommentId) {
                          // If user is already replying to top-level, cancel reply
                          proposalPageState.replying = false;
                        }
                        proposalPageState.parentCommentId = null;
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {!(proposal instanceof Thread) && hasBody && (
          <div class="proposal-content">
            <ProposalBodyText item={proposal} />
          </div>
        )}
      </div>
    );
  }
}
