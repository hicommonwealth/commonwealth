/* @jsx m */

import m from 'mithril';

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

type ProposalBodyAttrs = {
  commentCount: number;
  comments: Array<Comment<Thread>>;
  createdCommentCallback: () => void;
  getSetGlobalEditingStatus: (call: string, status?: boolean) => void;
  isAdminOrMod: boolean;
  isAuthor: boolean;
  isEditor: boolean;
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
      getSetGlobalEditingStatus,
      isAdminOrMod,
      isAuthor,
      isEditor,
      proposal,
      proposalPageState,
      viewCount,
    } = vnode.attrs;

    return (
      <div class="view-proposal-content-container">
        <ProposalHeader
          proposal={proposal}
          commentCount={commentCount}
          viewCount={viewCount}
          getSetGlobalEditingStatus={getSetGlobalEditingStatus}
          proposalPageState={proposalPageState}
          isAuthor={isAuthor}
          isEditor={isEditor}
          isAdmin={isAdminOrMod}
        />
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
          getSetGlobalEditingStatus={getSetGlobalEditingStatus}
          proposalPageState={proposalPageState}
          recentlySubmitted={proposalPageState.recentlySubmitted}
          isAdmin={isAdminOrMod}
        />
        {!proposalPageState.editing && !proposalPageState.parentCommentId && (
          <CreateComment
            callback={createdCommentCallback}
            cancellable
            getSetGlobalEditingStatus={getSetGlobalEditingStatus}
            proposalPageState={this}
            parentComment={null}
            rootProposal={proposal}
          />
        )}
      </div>
    );
  }
}
