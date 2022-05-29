import m from 'mithril';
import app from 'state';

import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { Thread, Poll } from 'models';
import { Button, Icons } from 'construct-ui';
import moment from 'moment';
import { alertModalWithText } from '../../modals/alert_modal';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import OffchainVotingModal from '../../modals/offchain_voting_modal';

const vote = async (
  poll: Poll,
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
    .submitVote(...userInfo, option)
    .then(() => m.redraw())
    .catch(async () => {
      await alertModalWithText(
        'Error submitting vote. Maybe the poll has already ended?'
      )();
    });
};

export const ProposalPoll: m.Component<
  { poll: Poll; thread: Thread },
  { votesFetched: boolean; threadId: number }
> = {
  view: (vnode) => {
    const { poll, thread } = vnode.attrs;
    const { threadId, votesFetched } = vnode.state;

    if (!votesFetched || threadId !== poll.threadId) {
      vnode.state.votesFetched = true;
      // TODO: Is this necessary? Can I initialize elsewhere?
      poll.getVotes();
      // `/api/viewVotes?thread_id=${proposal.id}${
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
    const voteSynopsis = m('.vote-synopsis', [
      optionScopedVotes.map((optionWithVotes) => {
        const optionVoteCount = optionWithVotes.votes.length;
        const optionVotePercentage = optionVoteCount / totalVoteCount;
        return m('.option-with-votes', [
          m('.option-results-label', [
            m(
              'div',
              { style: 'font-weight: 500; margin-right: 5px;' },
              `${optionWithVotes.option}`
            ),
            m('div', `(${optionVoteCount})`),
          ]),
          m('.poll-bar', {
            style: `width: ${Math.round(optionVotePercentage * 10000) / 100}%`,
          }),
        ]);
      }),
      m(
        'a',
        {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: OffchainVotingModal,
              data: { votes: poll.votes },
            });
          },
        },
        'See all votes'
      ),
    ]);

    return m('.ProposalPoll', [
      m('.offchain-poll-header', [
        poll.prompt || (pollingEnded ? 'Poll closed' : 'Poll open'),
      ]),
      !poll.options && m('.offchain-poll-invalid', '[Error loading poll]'),
      m(
        '.offchain-poll-options',
        poll.options?.map((option) => {
          const hasVoted =
            app.user.activeAccount &&
            poll.getUserVote(
              app.user.activeAccount.chain.id,
              app.user.activeAccount.address
            );
          const isSelected = hasVoted?.option === option;
          return m('.offchain-poll-option', [
            m('.offchain-poll-option-left', option),
            m('.offchain-poll-option-right', [
              m(Button, {
                onclick: () => vote(poll, option, isSelected),
                label: isSelected ? 'Voted' : 'Vote',
                size: 'sm',
                rounded: true,
                disabled: pollingEnded || isSelected || tokenThresholdFailed,
                style: pollingEnded || isSelected ? 'pointer-events: none' : '',
                iconLeft: isSelected ? Icons.CHECK : null,
                compact: true,
              }),
            ]),
          ]);
        })
      ),
      m('.offchain-poll-caption', [
        poll.endsAt
          ? [
              !pollingEnded && moment().from(poll.endsAt).replace(' ago', ''),
              !pollingEnded && ' left',
              m('br'),
              !pollingEnded && 'Ends ',
              pollingEnded && 'Ended ',
              poll.endsAt?.format('lll'),
            ]
          : 'Poll does not expire.',
      ]),
      m('.offchain-poll-header', 'Voters'),
      m('.offchain-poll-voters', [
        poll.votes.length === 0
          ? m('.offchain-poll-no-voters', 'Nobody has voted')
          : voteSynopsis,
      ]),
    ]);
  },
};
