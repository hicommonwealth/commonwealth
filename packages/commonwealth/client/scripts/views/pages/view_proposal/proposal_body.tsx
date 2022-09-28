/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/proposal_body.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import {
  AnyProposal,
  Comment,
  Thread,
  ThreadKind,
  ThreadStage,
  Topic,
} from 'models';
import { externalLink, extractDomain, pluralize } from 'helpers';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { getProposalUrlPath, proposalSlugToFriendlyName } from 'identifiers';
import { slugify } from 'utils';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { LinkedProposalsEmbed } from './linked_proposals_embed';
import { AaveViewProposalDetail } from './aave_summary';
import { VotingResults } from '../../components/proposals/voting_results';
import { VotingActions } from '../../components/proposals/voting_actions';
import { ProposalComments } from './proposal_comments';
import { CreateComment } from './create_comment';
import { ProposalPageState } from './types';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { EditComment } from './edit_comment';
import {
  ProposalBodyAttachments,
  ProposalBodyText,
} from './proposal_body_components';
import { ThreadReactionButton } from '../../components/reaction_button/thread_reaction_button';
import { InlineReplyButton } from '../../components/inline_reply_button';
import { activeQuillEditorHasText, scrollToForm } from './helpers';
import {
  QueueButton,
  ExecuteButton,
  CancelButton,
} from '../../components/proposals/voting_actions_components';
import {
  ProposalBodyAuthor,
  ProposalBodyCreated,
  ProposalBodyLastEdited,
  ProposalHeaderStage,
  ProposalTitleEditor,
} from './proposal_header_components';
import { SocialSharingCarat } from '../../components/social_sharing_carat';
import { ThreadSubscriptionMenuItem } from '../discussions/discussion_row_menu';
import {
  ProposalHeaderThreadLink,
  ProposalHeaderBlockExplorerLink,
  ProposalHeaderVotingInterfaceLink,
} from './proposal_header_links';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWText } from '../../components/component_kit/cw_text';
import {
  getStatusClass,
  getStatusText,
} from '../../components/proposal_card/helpers';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { EditCollaboratorsModal } from '../../modals/edit_collaborators_modal';
import { ChangeTopicModal } from '../../modals/change_topic_modal';

type ProposalBodyAttrs = {
  commentCount: number;
  comments: Array<Comment<Thread>>;
  createdCommentCallback: () => void;
  setIsGloballyEditing: (status: boolean) => void;
  isAdminOrMod: boolean;
  isAuthor: boolean;
  isEditor: boolean;
  isGloballyEditing: boolean;
  proposal: AnyProposal | Thread;
  proposalPageState: ProposalPageState;
  viewCount: number;
};

export class ProposalBody implements m.ClassComponent<ProposalBodyAttrs> {
  private isEditingBody: boolean;
  private updatedUrl: string;

  oninit(vnode) {
    this.updatedUrl = (vnode.attrs.proposal as Thread).url;
  }

  view(vnode) {
    const {
      commentCount,
      comments,
      createdCommentCallback,
      setIsGloballyEditing,
      isAdminOrMod,
      isAuthor,
      isEditor,
      isGloballyEditing,
      proposal,
      proposalPageState,
      viewCount,
    } = vnode.attrs;

    const hasBody = !!(proposal as AnyProposal).description;

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

    const setIsEditingBody = (status: boolean) => {
      setIsGloballyEditing(status);
      this.isEditingBody = status;
    };

    const hasEditPerms = isAuthor || isAdminOrMod || isEditor;

    return (
      <div class="ProposalBody">
        <div class="proposal-header">
          <div class="proposal-top">
            <div class="proposal-top-left">
              {this.isEditingBody ? (
                <ProposalTitleEditor
                  item={proposal}
                  setIsGloballyEditing={setIsGloballyEditing}
                  parentState={this}
                />
              ) : (
                <>
                  <CWText type="h3" fontWeight="semiBold">
                    {proposal.title}
                  </CWText>
                  {proposal instanceof Thread && proposal.readOnly && (
                    <CWIcon iconName="lock" iconSize="small" />
                  )}
                </>
              )}
              <ProposalBodyAuthor item={proposal} />
              <ProposalBodyCreated item={proposal} link={proposalLink} />
              <ProposalBodyLastEdited item={proposal} />
              <div class="proposal-body-meta">
                {proposal instanceof Thread ? (
                  <>
                    {proposal.stage !== ThreadStage.Discussion && (
                      <ProposalHeaderStage proposal={proposal} />
                    )}
                    <CWText
                      onclick={() =>
                        m.route.set(
                          `/${app.activeChainId()}/discussions/${
                            proposal.topic?.name
                          }`
                        )
                      }
                    >
                      {proposal.topic?.name}
                    </CWText>
                    <CWText>{pluralize(viewCount, 'view')}</CWText>
                    {app.isLoggedIn() && !isGloballyEditing && hasEditPerms && (
                      <CWPopoverMenu
                        popoverMenuItems={
                          [
                            ...(hasEditPerms && !proposal.readOnly
                              ? [
                                  {
                                    label: 'Edit',
                                    iconName: 'edit',
                                    onclick: async (e) => {
                                      e.preventDefault();

                                      if (proposalPageState.replying) {
                                        if (activeQuillEditorHasText()) {
                                          const confirmed =
                                            await confirmationModalWithText(
                                              'Unsubmitted replies will be lost. Continue?'
                                            )();

                                          if (!confirmed) return;
                                        }

                                        proposalPageState.replying = false;

                                        proposalPageState.parentCommentId =
                                          null;
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

                                      const isThread =
                                        proposal instanceof Thread;

                                      const confirmed =
                                        await confirmationModalWithText(
                                          isThread
                                            ? 'Delete this entire thread?'
                                            : 'Delete this comment?'
                                        )();

                                      if (!confirmed) return;

                                      (isThread ? app.threads : app.comments)
                                        .delete(proposal)
                                        .then(() => {
                                          if (isThread) navigateToSubpage('/');

                                          m.redraw();
                                          // TODO: set notification bar for 'thread deleted/comment deleted'
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
                                      const snapshotSpaces =
                                        app.chain.meta.snapshot;

                                      if (snapshotSpaces.length > 1) {
                                        navigateToSubpage(
                                          '/multiple-snapshots',
                                          {
                                            action: 'create-from-thread',
                                            proposal,
                                          }
                                        );
                                      } else {
                                        navigateToSubpage(
                                          `/snapshot/${snapshotSpaces}`
                                        );
                                      }
                                    },
                                  },
                                ]
                              : []),
                          ]
                          /* {(isAuthor || isAdminOrMod) && <CWDivider />}
                            <ThreadSubscriptionMenuItem
                              proposal={proposal as Thread}
                            /> */
                        }
                        trigger={
                          <CWIconButton
                            iconName="chevronDown"
                            iconSize="small"
                          />
                        }
                      />
                    )}
                    <SocialSharingCarat />
                  </>
                ) : (
                  <>
                    <ProposalBodyAuthor proposal={proposal} />
                    <CWText
                      className={`onchain-status-text ${getStatusClass(
                        proposal
                      )}`}
                    >
                      {getStatusText(proposal)}
                    </CWText>
                    {/* {app.isLoggedIn() &&
                      (isAdminOrMod || isAuthor) &&
                      !isGloballyEditing &&
                      proposalTitleIsEditable && (
                        <CWPopoverMenu
                          popoverMenuItems={[
                            {
                              label: 'Edit title',
                              iconName: 'edit',
                              onclick: async (e) => {
                                e.preventDefault();
                                if (proposalPageState.replying) {
                                  if (activeQuillEditorHasText()) {
                                    const confirmed =
                                      await confirmationModalWithText(
                                        'Unsubmitted replies will be lost. Continue?'
                                      )();

                                    if (!confirmed) return;
                                  }

                                  proposalPageState.replying = false;

                                  proposalPageState.parentCommentId = null;
                                }

                                setIsGloballyEditing(true);
                              },
                            },
                          ]}
                          trigger={
                            <CWIconButton
                              iconName="chevronDown"
                              iconSize="small"
                            />
                          }
                        />
                      )} */}
                  </>
                )}
              </div>
              <div class="proposal-body-link">
                {proposal instanceof Thread &&
                proposal.kind === ThreadKind.Link &&
                this.isEditingBody ? (
                  <CWTextInput
                    oninput={(e) => {
                      const { value } = (e as any).target;
                      this.updatedUrl = value;
                    }}
                    value={this.updatedUrl}
                  />
                ) : (
                  <div class="ProposalHeaderLink">
                    {externalLink('a', proposal.url, [
                      extractDomain(proposal.url),
                    ])}
                    <CWIcon iconName="externalLink" iconSize="small" />
                  </div>
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
                        <ProposalHeaderVotingInterfaceLink
                          proposal={proposal}
                        />
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
        <CWDivider />
        {proposal instanceof Thread && (
          <div class="proposal-content">
            <div class="proposal-content-right">
              {this.isEditingBody ? (
                <EditComment
                  comment={proposal}
                  setIsGloballyEditing={setIsEditingBody}
                  proposalPageState={proposalPageState}
                  updatedUrl={this.updatedUrl}
                />
              ) : (
                <>
                  <ProposalBodyText item={proposal} />
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
                    {attachments && attachments.length > 0 && (
                      <ProposalBodyAttachments item={proposal} />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {!(proposal instanceof Thread) && (
          <>
            <CWText>
              {proposalSlugToFriendlyName.get(proposal.slug)}{' '}
              {proposal.shortIdentifier}
            </CWText>
            <QueueButton proposal={proposal} />
            <ExecuteButton proposal={proposal} />
            <CancelButton proposal={proposal} />
            {hasBody && (
              <div class="proposal-content">
                <ProposalBodyText item={proposal} />
              </div>
            )}
          </>
        )}
        {!(proposal instanceof Thread) && (
          <LinkedProposalsEmbed proposal={proposal} />
        )}
        {proposal instanceof AaveProposal && (
          <AaveViewProposalDetail proposal={proposal} />
        )}
        {!(proposal instanceof Thread) && <VotingResults proposal={proposal} />}
        {!(proposal instanceof Thread) && <VotingActions proposal={proposal} />}
        <ProposalComments
          proposal={proposal}
          comments={comments}
          createdCommentCallback={createdCommentCallback}
          setIsGloballyEditing={setIsGloballyEditing}
          isGloballyEditing={isGloballyEditing}
          proposalPageState={proposalPageState}
          recentlySubmitted={proposalPageState.recentlySubmitted}
          isAdmin={isAdminOrMod}
        />
        {!isGloballyEditing && !proposalPageState.parentCommentId && (
          <CreateComment
            callback={createdCommentCallback}
            setIsGloballyEditing={setIsGloballyEditing}
            isGloballyEditing={isGloballyEditing}
            proposalPageState={this}
            parentComment={null}
            rootProposal={proposal}
          />
        )}
      </div>
    );
  }
}
