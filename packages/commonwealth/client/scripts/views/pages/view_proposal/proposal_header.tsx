/* @jsx m */

import m from 'mithril';
import { PopoverMenu, MenuItem } from 'construct-ui';

import 'pages/view_proposal/proposal_header.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { Thread, ThreadKind, AnyProposal, Topic, ThreadStage } from 'models';
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
  ProposalHeaderOnchainStatus,
  ProposalHeaderViewCount,
  ProposalHeaderPrivacyMenuItems,
  ProposalTitleEditor,
  ProposalTitleEditMenuItem,
  ProposalLinkEditor,
  EditCollaboratorsButton,
  ProposalBodyAuthor,
  ProposalBodyCreated,
  ProposalBodyDeleteMenuItem,
  EditTextMenuItem,
  ProposalBodyLastEdited,
} from './proposal_header_components';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import {
  ProposalHeaderExternalLink,
  ProposalHeaderThreadLink,
  ProposalHeaderBlockExplorerLink,
  ProposalHeaderVotingInterfaceLink,
} from './proposal_header_links';
import { QuillEditor } from '../../components/quill/quill_editor';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { ProposalPageState } from './types';

export class ProposalHeader
  implements
    m.ClassComponent<{
      viewCount: number;
      setIsGloballyEditing: (status: boolean) => void;
      isGloballyEditing: boolean;
      proposalPageState: ProposalPageState;
      proposal: AnyProposal | Thread;
      isAuthor: boolean;
      isEditor: boolean;
      isAdmin: boolean;
    }>
{
  private editing: boolean;
  private quillEditorState: QuillEditor;
  private savedEdit: string;
  private saving: boolean;
  private updatedTitle: string;
  private updatedUrl: string;

  view(vnode) {
    const {
      proposal,
      setIsGloballyEditing,
      isGloballyEditing,
      proposalPageState,
      viewCount,
      isAuthor,
      isEditor,
      isAdmin,
    } = vnode.attrs;

    const proposalLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}`
    );

    const proposalTitleIsEditable =
      proposal instanceof SubstrateDemocracyProposal ||
      proposal instanceof SubstrateCollectiveProposal ||
      proposal instanceof SubstrateTreasuryTip ||
      proposal instanceof SubstrateTreasuryProposal;

    return (
      <div class="ProposalHeader">
        <div class="proposal-top">
          <div class="proposal-top-left">
            {isGloballyEditing ? (
              <ProposalTitleEditor
                item={proposal}
                setIsGloballyEditing={setIsGloballyEditing}
                parentState={this}
              />
            ) : (
              <ProposalHeaderTitle proposal={proposal} />
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
                  <ProposalHeaderTopics proposalTopic={proposal.topic?.name} />
                  <ProposalHeaderViewCount viewCount={viewCount} />
                  {app.isLoggedIn() && !isGloballyEditing && (
                    <PopoverMenu
                      transitionDuration={0}
                      closeOnOutsideClick
                      closeOnContentClick
                      menuAttrs={{ size: 'default' }}
                      content={
                        <>
                          {(isEditor || isAuthor || isAdmin) &&
                            !proposal.readOnly && (
                              <EditTextMenuItem
                                proposalPageState={proposalPageState}
                                setIsGloballyEditing={setIsGloballyEditing}
                              />
                            )}
                          {isAuthor && (
                            <EditCollaboratorsButton proposal={proposal} />
                          )}
                          {isAdmin && (
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
                              setIsGloballyEditing={setIsGloballyEditing}
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
                    !isGloballyEditing &&
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
                            setIsGloballyEditing={setIsGloballyEditing}
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
              isGloballyEditing ? (
                <ProposalLinkEditor parentState={this} />
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
      </div>
    );
  }
}
