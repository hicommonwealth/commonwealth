/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/view_thread/thread_sidebar.scss';

import app from 'state';
import { ChainEntity, Poll, Thread, ThreadStage } from 'models';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import { PollCard } from '../../components/poll_card';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { LinkedProposalsCard } from './linked_proposals_card';
import { PollEditorCard } from './poll_editor_card';
import { getPollTimestamp, handlePollVote } from './helpers';
import { LinkedThreadsCard } from './linked_threads_card';

type ThreadSidebarAttrs = {
  isAdmin: boolean;
  isAdminOrMod: boolean;
  isAuthor: boolean;
  polls: Array<Poll>;
  thread: Thread;
  showLinkedSnapshotOptions: boolean;
  showLinkedThreadOptions: boolean;
};

export class ThreadSidebar implements m.ClassComponent<ThreadSidebarAttrs> {
  view(vnode) {
    const {
      isAdmin,
      isAdminOrMod,
      isAuthor,
      polls,
      thread,
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
              thread.stage = stage;
              thread.chainEntities = chainEntities;
              if (app.chain?.meta.snapshot.length) {
                thread.snapshotProposal = snapshotProposal[0]?.id;
              }
              app.threads.fetchThreadsFromId([thread.identifier]);
              m.redraw();
            }}
            thread={thread}
            showAddProposalButton={isAuthor || isAdminOrMod}
          />
        )}
        {showLinkedThreadOptions && (
          <LinkedThreadsCard
            threadlId={thread.id}
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
                timeRemaining={getPollTimestamp(
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
                  handlePollVote(poll, option, isSelected, callback)
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
            thread={thread}
            threadAlreadyHasPolling={!polls?.length}
          />
        )}
      </div>
    );
  }
}
