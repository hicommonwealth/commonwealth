import 'components/proposals/voting_results.scss';

import m from 'mithril';
import { VoteOutcome } from '@edgeware/node-types';
import { u8aToString } from '@polkadot/util';

import { formatCoin } from 'adapters/currency'; // TODO: remove formatCoin, only use coins.format()
import Tabs from 'views/components/widgets/tabs';
import User from 'views/components/widgets/user';
import { VotingType, VotingUnit, IVote, DepositVote, BinaryVote } from 'models';
import { SignalingVote, EdgewareSignalingProposal } from 'controllers/chain/edgeware/signaling_proposal';
import { first } from 'rxjs/operators';
import { CosmosVote, CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { CosmosVoteChoice } from 'adapters/chain/cosmos/types';
import { MolochProposalVote, MolochVote } from 'controllers/chain/ethereum/moloch/proposal';

const signalingVoteToString = (v: VoteOutcome): string => {
  const outcomeArray = v.toU8a();
  // cut off trailing 0s
  const sliceEnd = outcomeArray.indexOf(0);
  return u8aToString(outcomeArray.slice(0, sliceEnd));
};

const ProposalVotingResults: m.Component<{ proposal }> = {
  view: (vnode) => {
    const proposal = vnode.attrs.proposal;
    const votes = proposal.getVotes();
    const balanceWeighted = proposal.votingUnit === VotingUnit.CoinVote
      || proposal.votingUnit === VotingUnit.ConvictionCoinVote;

    // TODO: fix up this function for cosmos votes
    const showVotes = (votes2 : Array<IVote<any>>) => votes.length === 0
      ? m('.no-votes', 'No votes')
      : votes2.map(
        (vote) => {
          let balanceStr = '--';
          let balance;
          if (balanceWeighted && !(vote instanceof CosmosVote)) {
            vote.account.balance.pipe(first()).toPromise().then((b) => {
              balance = b;
              balanceStr = formatCoin(b, true);
            });
          }
          return vote instanceof SignalingVote ? m('.vote', [
            m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
            m('.vote-choice', signalingVoteToString(vote.choices[0])),
            balanceWeighted && balance && m('.vote-balance', balanceStr),
          ]) : vote instanceof BinaryVote ? m('.vote', [
            m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
            m('.vote-choice', vote.choice ? 'yes' : 'no'),
            balanceWeighted && balance && m('.vote-balance', balanceStr),
            m('.vote-weight', vote.weight && `${vote.weight}x`),
          ]) : vote instanceof DepositVote ? m('.vote', [
            m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
            m('.vote-deposit', formatCoin(vote.deposit, true)),
          ])
            : vote instanceof CosmosVote ? m('.vote', [
              m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
              m('.vote-choice', vote.choice.toString()),
              // balanceWeighted && balance && m('.vote-balance', balanceStr),
            ])
              : vote instanceof MolochProposalVote ? m('.vote', [
                m('.vote-voter', m(User, { user: vote.account, linkify: true })),
                m('.vote-choice', vote.choice.toString()),
                balance && m('.vote-balance', balanceStr),
              ])
                : m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                ]);
        }
      );

    if (proposal instanceof EdgewareSignalingProposal) {
      return m('.ProposalVotingResults', [
        m(Tabs, [{
          name: 'Voters',
          content: showVotes(votes)
        }].concat(
          proposal.data.choices.map((outcome) => {
            return {
              name: signalingVoteToString(outcome),
              content: showVotes(
                votes.filter((v) => signalingVoteToString(v.choices[0]) === signalingVoteToString(outcome))
              ),
            };
          })
        ))
      ]);
    } else if (proposal.votingType === VotingType.SimpleYesNoVoting) {
      return m('.ProposalVotingResults', [
        m(Tabs, [{
          name: 'Voters',
          content: showVotes(votes)
        }, {
          name: 'Yes',
          content: showVotes(votes.filter((v) => v.choice === true))
        }, {
          name: 'No',
          content: showVotes(votes.filter((v) => v.choice === false)),
        }]),
      ]);
    } else if (proposal.votingType === VotingType.MolochYesNo) { // TODO: merge with above
      return m('.ProposalVotingResults', [
        m(Tabs, [{
          name: 'Voters',
          content: showVotes(votes)
        }, {
          name: 'Yes',
          content: showVotes(votes.filter((v) => v.choice === MolochVote.YES))
        }, {
          name: 'No',
          content: showVotes(votes.filter((v) => v.choice === MolochVote.NO)),
        }]),
      ]);
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      return m('.ProposalVotingResults', [
        m(Tabs, [{
          name: 'Voters',
          content: showVotes(votes)
        }, {
          name: 'Yes',
          content: showVotes(votes.filter((v) => v.choice === true))
        }, {
          name: 'No',
          content: showVotes(votes.filter((v) => v.choice === false)),
        }]),
      ]);
    } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
      return m('.ProposalVotingResults', [
        m(Tabs, [{
          name: 'Voters',
          content: showVotes(votes)
        }, {
          name: 'Yes',
          content: showVotes(votes.filter((v) => v.choice === CosmosVoteChoice.YES))
        }, {
          name: 'No',
          content: showVotes(
            votes.filter((v) => v.choice === CosmosVoteChoice.NO || v.choice === CosmosVoteChoice.VETO)
          )
        }, {
          name: 'Abstain',
          content: showVotes(votes.filter((v) => v.choice === CosmosVoteChoice.ABSTAIN))
        }, {
          name: 'Veto',
          content: showVotes(votes.filter((v) => v.choice === CosmosVoteChoice.VETO)),
        }]),
      ]);
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting
               && proposal instanceof CosmosProposal) {
      // special case for cosmos proposals in deposit stage
      return m('.ProposalVotingResults', showVotes(proposal.depositorsAsVotes));
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
      return m('.ProposalVotingResults', showVotes(votes));
    } else if (proposal.votingType === VotingType.RankedChoiceVoting) {
      // to be implemented
    } else {
      // to be implemented
    }
  }
};

export default ProposalVotingResults;
