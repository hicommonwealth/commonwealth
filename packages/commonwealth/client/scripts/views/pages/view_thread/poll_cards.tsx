/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/view_thread/poll_cards.scss';

import app from 'state';
import { Poll, Thread } from 'models';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { PollEditorModal } from '../../modals/poll_editor_modal';
import { PollCard } from '../../components/poll_card';
import { getPollTimestamp, handlePollVote } from './helpers';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';

export class ThreadPollEditorCard
  implements
    m.ClassComponent<{
      thread: Thread;
      threadAlreadyHasPolling: boolean;
    }>
{
  view(vnode) {
    const { thread, threadAlreadyHasPolling } = vnode.attrs;

    return (
      <CWCard className="PollEditorCard">
        <CWText type="h5">
          Add {threadAlreadyHasPolling ? 'an' : 'another'} offchain poll to this
          thread?
        </CWText>
        <CWButton
          disabled={!!thread.offchainVotingEndsAt}
          label={thread.votingEndTime ? 'Polling enabled' : 'Create poll'}
          onclick={(e) => {
            e.preventDefault();
            app.modals.create({
              modal: PollEditorModal,
              data: {
                thread,
              },
            });
          }}
        />
      </CWCard>
    );
  }
}

export class ThreadPollCard implements m.ClassComponent<{ poll: Poll }> {
  view(vnode: m.VnodeDOM<{ poll: Poll }, this>) {
    const { poll } = vnode.attrs;

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
            voteCount: poll.votes.filter((v) => v.option === option).length,
          };
        })}
        incrementalVoteCast={1}
        isPreview={false}
        tooltipErrorMessage={
          app.user.activeAccount
            ? null
            : 'You must join this community to vote.'
        }
        onVoteCast={(option, callback, isSelected) =>
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
}
