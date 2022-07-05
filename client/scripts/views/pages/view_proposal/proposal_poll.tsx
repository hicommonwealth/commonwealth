/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/proposal_poll.scss';

import app from 'state';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { OffchainThread, OffchainPoll } from 'models';
import moment from 'moment';
import { alertModalWithText } from '../../modals/alert_modal';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { CWButton } from '../../components/component_kit/cw_button';

const vote = async (
  poll: OffchainPoll,
  option: string,
  isSelected: boolean
) => {
  const { activeAccount } = app.user;

  if (!app.isLoggedIn() || !activeAccount || isSelected) return;

  const userInfo = [activeAccount.chain.id, activeAccount.address] as const;

  let confirmationText;

  if (poll.getUserVote(...userInfo)) {
    confirmationText = `Change your vote to '${option}'?`;
  } else {
    confirmationText = `Submit a vote for '${option}'?`;
  }

  const confirmed = await confirmationModalWithText(confirmationText)();

  if (!confirmed) return;
  // submit vote
  poll
    .submitOffchainVote(...userInfo, option)
    .then(() => m.redraw())
    .catch(async () => {
      await alertModalWithText(
        'Error submitting vote. Maybe the poll has already ended?'
      )();
    });
};

export class ProposalPoll
  implements m.ClassComponent<{ poll: OffchainPoll; thread: OffchainThread }>
{
  private threadId: number;
  private votesFetched: boolean;

  view(vnode) {
    const { poll, thread } = vnode.attrs;
    const { threadId, votesFetched } = this;

    if (!votesFetched || threadId !== poll.threadId) {
      this.votesFetched = true;
      // TODO: Is this necessary? Can I initialize elsewhere?
      poll.getVotes();
      // `/api/viewOffchainVotes?thread_id=${proposal.id}${
    }

    const pollingEnded = poll.endsAt && poll.endsAt?.isBefore(moment().utc());

    const tokenThresholdFailed = TopicGateCheck.isGatedTopic(thread.topic.name);

    const optionScopedVotes = poll.options.map((option) => {
      return {
        option,
        votes: poll.votes.filter((v) => v.option === option),
      };
    });

    const totalVoteCount = poll.votes.length;

    const voteSynopsis = (
      <div class="vote-synopsis">
        {optionScopedVotes.map((optionWithVotes) => {
          const optionVoteCount = optionWithVotes.votes.length;
          const optionVotePercentage = optionVoteCount / totalVoteCount;

          return (
            <div class="option-with-votes">
              <div class="option-results-label">
                <div style="font-weight: 500; margin-right: 5px;">
                  {optionWithVotes.option}
                </div>
                <div>{optionVoteCount}</div>
              </div>
              <div
                class="poll-bar"
                style={`width: ${
                  Math.round(optionVotePercentage * 10000) / 100
                }%`}
              />
            </div>
          );
        })}
        <a
          href="#"
          onclick={(e) => {
            e.preventDefault();
            app.modals.create({
              modal: OffchainVotingModal,
              data: { votes: poll.votes },
            });
          }}
        >
          See all votes
        </a>
      </div>
    );

    return (
      <div class="ProposalPoll">
        <div class="offchain-poll-header">
          {poll.prompt || (pollingEnded ? 'Poll closed' : 'Poll open')}
        </div>
        {!poll.options && (
          <div class="offchain-poll-invalid">Error loading poll</div>
        )}
        <div class="offchain-poll-options">
          {poll.options?.map((option) => {
            const hasVoted =
              app.user.activeAccount &&
              poll.getUserVote(
                app.user.activeAccount.chain.id,
                app.user.activeAccount.address
              );

            const isSelected = hasVoted?.option === option;

            return (
              <div class="offchain-poll-option">
                <div class="offchain-poll-option-left">{option}</div>
                <div class="offchain-poll-option-right">
                  <CWButton
                    onclick={() => vote(poll, option, isSelected)}
                    label={isSelected ? 'Voted' : 'Vote'}
                    disabled={
                      pollingEnded || isSelected || tokenThresholdFailed
                    }
                    // style={pollingEnded || isSelected ? 'pointer-events: none' : ''}
                    // iconLeft={isSelected ? Icons.CHECK : null}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div class="offchain-poll-caption">
          {poll.endsAt
            ? [
                !pollingEnded && moment().from(poll.endsAt).replace(' ago', ''),
                !pollingEnded && ' left',
                m('br'),
                !pollingEnded && 'Ends ',
                pollingEnded && 'Ended ',
                poll.endsAt?.format('lll'),
              ]
            : 'Poll does not expire.'}
        </div>
        <div class="offchain-poll-header">Voters</div>
        <div class="offchain-poll-voters">
          {poll.votes.length === 0 ? (
            <div class="offchain-poll-no-voters">Nobody has voted</div>
          ) : (
            voteSynopsis
          )}
        </div>
      </div>
    );
  }
}
