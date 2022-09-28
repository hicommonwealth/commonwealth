/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/proposal_body.scss';

import { AnyProposal, Comment, Thread } from 'models';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { ProposalHeader } from './proposal_header';
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
import { scrollToForm } from './helpers';
import {
  QueueButton,
  ExecuteButton,
  CancelButton,
} from '../../components/proposals/voting_actions_components';
import { ProposalHeaderOnchainId } from './proposal_header_components';

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

    return (
      <div class="ProposalBody">
        <ProposalHeader
          proposal={proposal}
          viewCount={viewCount}
          setIsGloballyEditing={setIsGloballyEditing}
          isGloballyEditing={isGloballyEditing}
          proposalPageState={proposalPageState}
          isAuthor={isAuthor}
          isEditor={isEditor}
          isAdmin={isAdminOrMod}
        />
        <CWDivider />
        {proposal instanceof Thread && (
          <div class="proposal-content">
            <div class="proposal-content-right">
              {isGloballyEditing ? (
                <EditComment
                  comment={proposal}
                  setIsGloballyEditing={setIsGloballyEditing}
                  proposalPageState={proposalPageState}
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
            <ProposalHeaderOnchainId proposal={proposal} />
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
