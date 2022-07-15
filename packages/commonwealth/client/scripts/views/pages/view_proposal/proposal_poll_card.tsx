/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/view_proposal/proposal_poll_card.scss';

import app from 'state';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { OffchainThread, OffchainPoll } from 'models';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import { getProposalPollTimestamp, handleProposalPollVote } from './helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { CWCard } from '../../components/component_kit/cw_card';

type ProposalPollCardAttrs = { poll: OffchainPoll; thread: OffchainThread };

export class ProposalPollCard
  implements m.ClassComponent<ProposalPollCardAttrs>
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

    return (
      <CWCard elevation="elevation-1" className="ProposalPollCard">
        <CWText type="h4" fontWeight="semiBold">
          {poll.prompt || (pollingEnded ? 'Poll closed' : 'Poll open')}
        </CWText>
        {!poll.options && (
          <CWText
            type="caption"
            fontWeight="semiBold"
            className="poll-error-text"
          >
            Error loading poll
          </CWText>
        )}
        {poll.options?.map((option) => {
          const hasVoted =
            app.user.activeAccount &&
            poll.getUserVote(
              app.user.activeAccount.chain.id,
              app.user.activeAccount.address
            );

          const isSelected = hasVoted?.option === option;

          return (
            <div class="poll-option-row">
              <CWText>{option}</CWText>
              <CWButton
                onclick={() => handleProposalPollVote(poll, option, isSelected)}
                label={isSelected ? 'Voted' : 'Vote'}
                disabled={pollingEnded || isSelected || tokenThresholdFailed}
                iconName={isSelected ? 'check' : ''}
              />
            </div>
          );
        })}
        <CWText type="caption" className="poll-timestamp-text">
          {poll.endsAt
            ? getProposalPollTimestamp(poll, pollingEnded)
            : 'Poll does not expire.'}
        </CWText>
        <CWText type="h5" fontWeight="semiBold">
          Voters
        </CWText>
        {poll.votes.length === 0 ? (
          <CWText className="no-voters-text">Nobody has voted</CWText>
        ) : (
          <>
            {optionScopedVotes.map((optionWithVotes) => {
              const optionVoteCount = optionWithVotes.votes.length;
              const optionVotePercentage = optionVoteCount / totalVoteCount;

              return (
                <div class="option-with-votes">
                  <div class="option-results-label">
                    <CWText fontWeight="medium">
                      {`${optionWithVotes.option} (${optionVoteCount})`}
                    </CWText>
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
          </>
        )}
      </CWCard>
    );
  }
}
