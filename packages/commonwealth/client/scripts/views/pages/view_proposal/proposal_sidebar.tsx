/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/view_proposal/proposal_sidebar.scss';

import app from 'state';
import { ChainEntity, Poll, Thread, ThreadStage } from 'models';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import { PollCard } from '../../components/poll_card';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { getProposalPollTimestamp, handleProposalPollVote } from './helpers';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { PollEditorCard } from './poll_editor_card';

type ProposalSidebarAttrs = {
  isAdmin: boolean;
  isAdminOrMod: boolean;
  isAuthor: boolean;
  polls: Array<Poll>;
  proposal: Thread;
  showLinkedSnapshotOptions: boolean;
  showLinkedThreadOptions: boolean;
};

export class ProposalSidebar implements m.ClassComponent<ProposalSidebarAttrs> {
  view(vnode) {
    const {
      isAdmin,
      isAdminOrMod,
      isAuthor,
      polls,
      proposal,
      showLinkedSnapshotOptions,
      showLinkedThreadOptions,
    } = vnode.attrs;

    return (
      <div class="ProposalSidebar">
        {showLinkedSnapshotOptions && (
          <LinkedProposalsCard
            onChangeHandler={(
              stage: ThreadStage,
              chainEntities: ChainEntity[],
              snapshotProposal: SnapshotProposal[]
            ) => {
              proposal.stage = stage;
              proposal.chainEntities = chainEntities;
              if (app.chain?.meta.snapshot) {
                proposal.snapshotProposal = snapshotProposal[0]?.id;
              }
              app.threads.fetchThreadsFromId([proposal.identifier]);
              m.redraw();
            }}
            thread={proposal}
            showAddProposalButton={isAuthor || isAdminOrMod}
          />
        )}
        {showLinkedThreadOptions && (
          <LinkedThreadsCard
            proposalId={proposal.id}
            allowLinking={isAuthor || isAdminOrMod}
          />
        )}
        {[...new Map(polls?.map((poll) => [poll.id, poll])).values()].map(
          (poll: Poll) => {
            return (
              <PollCard
                multiSelect={false}
                pollEnded={poll.endsAt && poll.endsAt?.isBefore(moment().utc())}
                hasVoted={
                  app.user.activeAccount &&
                  poll.getUserVote(
                    app.user.activeAccount?.chain?.id,
                    app.user.activeAccount?.address
                  )
                }
                disableVoteButton={!app.user.activeAccount}
                votedFor={
                  poll.getUserVote(
                    app.user.activeAccount?.chain?.id,
                    app.user.activeAccount?.address
                  )?.option
                }
                proposalTitle={poll.prompt}
                timeRemaining={getProposalPollTimestamp(
                  poll,
                  poll.endsAt && poll.endsAt?.isBefore(moment().utc())
                )}
                totalVoteCount={poll.votes?.length}
                voteInformation={poll.options.map((option) => {
                  return {
                    label: option,
                    value: option,
                    voteCount: poll.votes.filter((v) => v.option === option)
                      .length,
                  };
                })}
                incrementalVoteCast={1}
                isPreview={false}
                tooltipErrorMessage={
                  app.user.activeAccount
                    ? null
                    : 'You must join this community to vote.'
                }
                onVoteCast={(option, isSelected, callback) =>
                  handleProposalPollVote(poll, option, isSelected, callback)
                }
                onResultsClick={(e) => {
                  e.preventDefault();
                  if (poll.votes.length > 0) {
                    app.modals.create({
                      modal: OffchainVotingModal,
                      data: { votes: poll.votes },
                    });
                  }
                }}
              />
            );
          }
        )}
        {isAuthor && (!app.chain?.meta?.adminOnlyPolling || isAdmin) && (
          <PollEditorCard
            proposal={proposal}
            proposalAlreadyHasPolling={!polls?.length}
          />
        )}
      </div>
    );
  }
}
