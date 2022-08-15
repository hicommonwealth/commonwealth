/* @jsx m */

import m from 'mithril';
import { PopoverMenu, MenuItem } from 'construct-ui';

import 'pages/view_proposal/proposal_header.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { Thread, ThreadKind, AnyProposal } from 'models';
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
} from './header';
import {
  GlobalStatus,
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
import { IProposalPageState, scrollToForm } from '.';
import { CWDivider } from '../../components/component_kit/cw_divider';

export class ProposalHeader
  implements
    m.ClassComponent<{
      commentCount: number;
      viewCount: number;
      getSetGlobalEditingStatus: CallableFunction;
      proposalPageState: IProposalPageState;
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

    return m(
      '.ProposalHeader',
      {
        class: `proposal-${proposal.slug}`,
      },
      [
        m('.proposal-top', [
          m('.proposal-top-left', [
            !(proposal instanceof Thread) &&
              m('.proposal-meta-top', [
                m('.proposal-meta-top-left', [
                  m(ProposalHeaderOnchainId, { proposal }),
                ]),
                m('.proposal-meta-top-right', [
                  <QueueButton proposal={proposal} />,
                  <ExecuteButton proposal={proposal} />,
                  <CancelButton proposal={proposal} />,
                ]),
              ]),
            !this.editing &&
              m('.proposal-title', [m(ProposalHeaderTitle, { proposal })]),
            this.editing &&
              m(ProposalTitleEditor, {
                item: proposal,
                getSetGlobalEditingStatus,
                parentState: this,
              }),
            m(
              '.proposal-body-meta',
              proposal instanceof Thread
                ? [
                    m(ProposalHeaderStage, { proposal }),
                    m(ProposalHeaderTopics, { proposal }),
                    m(ProposalBodyCreated, {
                      item: proposal,
                      link: proposalLink,
                    }),
                    m(ProposalBodyLastEdited, { item: proposal }),
                    m(ProposalBodyAuthor, { item: proposal }),
                    m(ProposalHeaderViewCount, { viewCount }),
                    app.isLoggedIn() &&
                      !getSetGlobalEditingStatus(GlobalStatus.Get) && (
                        <PopoverMenu
                          transitionDuration={0}
                          closeOnOutsideClick
                          closeOnContentClick
                          menuAttrs={{ size: 'default' }}
                          content={[
                            (isEditor || isAuthor || isAdmin) &&
                              m(ProposalBodyEditMenuItem, {
                                item: proposal,
                                proposalPageState:
                                  vnode.attrs.proposalPageState,
                                getSetGlobalEditingStatus,
                                parentState: this,
                              }),
                            isAuthor &&
                              m(EditCollaboratorsButton, {
                                proposal,
                              }),
                            isAdmin && proposal instanceof Thread && (
                              <ChangeTopicMenuItem proposal={proposal} />
                            ),
                            (isAuthor || isAdmin || app.user.isSiteAdmin) &&
                              m(ProposalBodyDeleteMenuItem, { item: proposal }),
                            (isAuthor || isAdmin) &&
                              m(ProposalHeaderPrivacyMenuItems, {
                                proposal,
                                getSetGlobalEditingStatus,
                              }),
                            (isAuthor || isAdmin) &&
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
                              ),
                            (isAuthor || isAdmin) && <CWDivider />,
                            <ThreadSubscriptionMenuItem
                              proposal={proposal as Thread}
                            />,
                          ]}
                          trigger={
                            <div>
                              <CWIcon iconName="chevronDown" iconSize="small" />
                            </div>
                          }
                        />
                      ),
                    <SocialSharingCarat />,
                  ]
                : [
                    m(ProposalBodyAuthor, { item: proposal }),
                    m(ProposalHeaderOnchainStatus, { proposal }),
                    app.isLoggedIn() &&
                      (isAdmin || isAuthor) &&
                      !getSetGlobalEditingStatus(GlobalStatus.Get) &&
                      proposalTitleIsEditable && (
                        <PopoverMenu
                          transitionDuration={0}
                          closeOnOutsideClick
                          closeOnContentClick
                          menuAttrs={{ size: 'default' }}
                          content={[
                            m(ProposalTitleEditMenuItem, {
                              item: proposal,
                              proposalPageState,
                              getSetGlobalEditingStatus,
                              parentState: this,
                            }),
                          ]}
                          trigger={
                            <div>
                              <CWIcon iconName="chevronDown" iconSize="small" />
                            </div>
                          }
                        />
                      ),
                  ]
            ),
            m('.proposal-body-link', [
              proposal instanceof Thread &&
                proposal.kind === ThreadKind.Link && [
                  this.editing
                    ? m(ProposalLinkEditor, {
                        item: proposal,
                        parentState: this,
                      })
                    : m(ProposalHeaderExternalLink, { proposal }),
                ],
              !(proposal instanceof Thread) &&
                (proposal['blockExplorerLink'] ||
                  proposal['votingInterfaceLink'] ||
                  proposal.threadId) &&
                m('.proposal-body-link', [
                  proposal.threadId &&
                    m(ProposalHeaderThreadLink, { proposal }),
                  proposal['blockExplorerLink'] &&
                    m(ProposalHeaderBlockExplorerLink, { proposal }),
                  proposal['votingInterfaceLink'] &&
                    m(ProposalHeaderVotingInterfaceLink, { proposal }),
                ]),
            ]),
          ]),
        ]),
        <CWDivider />,
        proposal instanceof Thread &&
          m('.proposal-content', [
            (commentCount > 0 || app.user.activeAccount) &&
              m('.thread-connector'),
            m('.proposal-content-left', [
              m(ProposalBodyAvatar, { item: proposal }),
            ]),
            m('.proposal-content-right', [
              !this.editing && m(ProposalBodyText, { item: proposal }),
              !this.editing &&
                attachments &&
                attachments.length > 0 &&
                m(ProposalBodyAttachments, { item: proposal }),
              this.editing &&
                m(ProposalBodyEditor, {
                  item: proposal,
                  parentState: this,
                }),
              m('.proposal-body-bottom', [
                this.editing &&
                  m('.proposal-body-button-group', [
                    m(ProposalBodySaveEdit, {
                      item: proposal,
                      getSetGlobalEditingStatus,
                      parentState: this,
                    }),
                    m(ProposalBodyCancelEdit, {
                      item: proposal,
                      getSetGlobalEditingStatus,
                      parentState: this,
                    }),
                  ]),
                !this.editing &&
                  m('.proposal-response-row', [
                    <ThreadReactionButton thread={proposal} />,
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
                    />,
                  ]),
              ]),
            ]),
          ]),
        !(proposal instanceof Thread) &&
          hasBody &&
          m('.proposal-content', [m(ProposalBodyText, { item: proposal })]),
      ]
    );
  }
}
