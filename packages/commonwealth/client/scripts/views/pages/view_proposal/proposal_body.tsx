/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import lity from 'lity';

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
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
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
import { ThreadReactionButton } from '../../components/reaction_button/thread_reaction_button';
import { activeQuillEditorHasText, clearEditingLocalStorage } from './helpers';
import {
  QueueButton,
  ExecuteButton,
  CancelButton,
} from '../../components/proposals/voting_actions_components';
import {
  ProposalBodyAuthor,
  ProposalBodyLastEdited,
  ProposalBodyText,
  ProposalHeaderStage,
  ProposalTitleEditor,
} from './proposal_components';
import { SocialSharingCarat } from './social_sharing_carat';
import { getThreadSubScriptionMenuItem } from '../discussions/discussion_row_menu';
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
import { EditBody } from './edit_body';
import { ContentType } from 'shared/types';

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
  private updatedUrl: string;

  oninit(vnode) {
    this.updatedUrl = (vnode.attrs.proposal as Thread).url;
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
            <CWText type="caption" className="published-text">
              published on {moment(proposal.createdAt).format('l')}
            </CWText>
            {/* {proposal.stage !== ThreadStage.Discussion && (
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
                    <CWText>{pluralize(viewCount, 'view')}</CWText> */}
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

          {/* <CWText
                  className={`onchain-status-text ${getStatusClass(proposal)}`}
                >
                  {getStatusText(proposal)}
                </CWText> */}
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
          {/* <div class="proposal-body-link">
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
              </div> */}
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
                updatedUrl={this.updatedUrl}
              />
            ) : (
              <>
                <ProposalBodyText item={proposal} />
                {!isGloballyEditing && canComment && (
                  <CreateComment
                    updatedCommentsCallback={updatedCommentsCallback}
                    setIsGloballyEditing={setIsGloballyEditing}
                    isGloballyEditing={isGloballyEditing}
                    proposalPageState={this}
                    parentComment={null}
                    rootProposal={proposal}
                  />
                )}
                {/* <div class="proposal-response-row">
                  {attachments && attachments.length > 0 && (
                    <>
                      <CWText>
                        Attachments ({proposal.attachments.length})
                      </CWText>
                      {proposal.attachments.map((attachment) => (
                        <a
                          href={attachment.url}
                          title={attachment.description}
                          target="_blank"
                          noopener="noopener"
                          noreferrer="noreferrer"
                          onclick={(e) => {
                            e.preventDefault();
                            lity(attachment.url);
                          }}
                        >
                          <img src={attachment.url} />
                        </a>
                      ))}
                    </>
                  )}
                </div> */}
              </>
            )}
          </div>
        )}

        {/* subBody components */}

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
