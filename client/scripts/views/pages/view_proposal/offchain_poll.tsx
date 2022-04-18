/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import moment from 'moment';
import { Button, Icons } from 'construct-ui';

import 'pages/view_proposal/offchain_poll.scss';

import app from 'state';
import { OffchainThread } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { alertModalWithText } from 'views/modals/alert_modal';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import OffchainVotingModal from '../../modals/offchain_voting_modal';

type ProposalScopedVotes = {
  proposalId?: boolean;
};

export class OffchainPoll
  implements m.ClassComponent<{ proposal: OffchainThread }>
{
  private offchainVotes: ProposalScopedVotes;

  view(vnode) {
    const { proposal } = vnode.attrs;
    if (!proposal.offchainVotingEnabled) return;

    if (
      this.offchainVotes === undefined ||
      this.offchainVotes[proposal.id] === undefined
    ) {
      // initialize or reset offchain votes
      this.offchainVotes = {};
      this.offchainVotes[proposal.id] = true;
      // fetch from backend, and then set
      $.get(
        `/api/viewOffchainVotes?thread_id=${proposal.id}${
          app.activeChainId() ? `&chain=${app.activeChainId()}` : ''
        }`
      )
        .then((result) => {
          if (result.result.length === 0) return;
          if (result.result[0].thread_id !== proposal.id) return;
          proposal.setOffchainVotes(result.result);
          m.redraw();
        })
        .catch(async () => {
          notifyError('Unexpected error loading offchain votes');
        });
    }

    const pollingEnded =
      proposal.offchainVotingEndsAt &&
      proposal.offchainVotingEndsAt?.isBefore(moment().utc());

    const tokenThresholdFailed = TopicGateCheck.isGatedTopic(
      proposal.topic.name
    );

    const vote = async (option, isSelected) => {
      if (!app.isLoggedIn() || !app.user.activeAccount || isSelected) return;

      const confirmationText = `Submit your vote for '${option}'?`;
      const confirmed = await confirmationModalWithText(confirmationText)();
      if (!confirmed) return;
      // submit vote
      proposal
        .submitOffchainVote(
          proposal.chain,
          proposal.community,
          app.user.activeAccount.chain.id,
          app.user.activeAccount.address,
          option
        )
        .catch(async () => {
          await alertModalWithText(
            'Error submitting vote. Maybe the poll has already ended?'
          )();
        });
    };

    const optionScopedVotes = proposal.offchainVotingOptions.choices.map(
      (option) => {
        return {
          option,
          votes: proposal.offchainVotes.filter((v) => v.option === option),
        };
      }
    );

    const totalVoteCount = proposal.offchainVotes.length;

    const voteSynopsis = (
      <div class="vote-synopsis">
        {optionScopedVotes.map((optionWithVotes) => {
          const optionVoteCount = optionWithVotes.votes.length;
          const optionVotePercentage = optionVoteCount / totalVoteCount;

          return (
            <div class="option-with-votes">
              <div class="option-result-label">
                <div class="option-text">{optionWithVotes.option}</div>
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
              data: { votes: proposal.offchainVotes },
            });
          }}
        >
          See all votes
        </a>
      </div>
    );

    return (
      <div class="OffchainPoll">
        <h4>
          {proposal.offchainVotingOptions?.name ||
            (pollingEnded ? 'Poll closed' : 'Poll open')}
        </h4>
        {!proposal.offchainVotingOptions?.choices && (
          <div class="invalid">[Error loading poll]</div>
        )}
        <div class="options">
          {proposal.offchainVotingOptions?.choices?.map((option) => {
            const hasVoted =
              app.user.activeAccount &&
              proposal.getOffchainVoteFor(
                app.user.activeAccount.chain.id,
                app.user.activeAccount.address
              );

            const isSelected = hasVoted?.option === option;

            return (
              <div class="option">
                <div class="option-left">{option}</div>
                <div class="option-right">
                  <Button
                    onclick={vote.bind(this, option, isSelected)}
                    label={isSelected ? 'Voted' : 'Vote'}
                    size="sm"
                    rounded={true}
                    disabled={
                      pollingEnded || isSelected || tokenThresholdFailed
                    }
                    style={
                      pollingEnded || isSelected ? 'pointer-events: none' : ''
                    }
                    iconLeft={isSelected ? Icons.CHECK : null}
                    compact={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div class="caption">
          {proposal.offchainVotingEndsAt ? (
            <>
              {!pollingEnded &&
                moment()
                  .from(proposal.offchainVotingEndsAt)
                  .replace(' ago', '')}
              {!pollingEnded && ' left'}
              <br />
              {!pollingEnded && 'Ends '}
              {pollingEnded && 'Ended '}
              {proposal.offchainVotingEndsAt?.format('lll')}
            </>
          ) : (
            'Poll does not expire.'
          )}
        </div>
        <h4>Voters</h4>
        <div class="voters">
          {proposal.offchainVotes.length === 0 ? (
            <div class="no-voters">Nobody has voted</div>
          ) : (
            voteSynopsis
          )}
        </div>
      </div>
    );
  }
}
