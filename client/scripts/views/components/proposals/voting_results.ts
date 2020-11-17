import 'components/proposals/voting_results.scss';

import m from 'mithril';
import { VoteOutcome } from '@edgeware/node-types';
import { u8aToString } from '@polkadot/util';

import { formatCoin } from 'adapters/currency'; // TODO: remove formatCoin, only use coins.format()
import Tabs from 'views/components/widgets/tabs';
import User from 'views/components/widgets/user';
import { VotingType, VotingUnit, IVote, DepositVote, BinaryVote, AnyProposal } from 'models';
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

const VoteListing: m.Component<{
  proposal: AnyProposal,
  votes : Array<IVote<any>>,
  amount?: boolean,
  weight?: boolean
}, {
  expanded?: boolean,
}> = {
  view: (vnode) => {
    const { proposal, votes, amount, weight } = vnode.attrs;
    const balanceWeighted = proposal.votingUnit === VotingUnit.CoinVote
      || proposal.votingUnit === VotingUnit.ConvictionCoinVote;
    const displayedVotes = vnode.state.expanded
      ? votes
      : votes.slice(0, 3);

    return m('.VoteListing', [
      (displayedVotes.length === 0)
        ? m('.no-votes', 'No votes')
        : displayedVotes.map(
          (vote) => {
            console.log(vote);
            let balanceStr = '--';
            let balance;
            if (balanceWeighted && !(vote instanceof CosmosVote)) {
              vote.account.balance.pipe(first()).toPromise().then((b) => {
                balance = b;
                balanceStr = formatCoin(b, true);
              });
            }
            console.log(vote instanceof SignalingVote);
            console.log(vote instanceof BinaryVote);
            console.log(vote instanceof DepositVote);
            console.log(vote instanceof CosmosVote);
            console.log(vote instanceof MolochProposalVote);
            return vote instanceof SignalingVote ? m('.vote', [
              m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
              m('.vote-choice', signalingVoteToString(vote.choices[0])),
              balanceWeighted && balance && m('.vote-balance', balanceStr),
            ]) : vote instanceof BinaryVote ? m('.vote', [
              m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
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
        ),
      !vnode.state.expanded
      && votes.length > 3
      && m('a.expand-listing-button', {
        href: '#',
        onclick: (e) => {
          e.preventDefault();
          vnode.state.expanded = true;
        }
      }, `${votes.length - 3} more`)
    ]);
  }
};

const ProposalVotingResults: m.Component<{ proposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const votes = proposal.getVotes();

    // TODO: fix up this function for cosmos votes
    console.log(proposal.votingType);
    if (proposal instanceof EdgewareSignalingProposal) {
      return m('.ProposalVotingResults', [
        proposal.data.choices.map((outcome) => {
          return m('.results-column', [
            m('.results-header', signalingVoteToString(outcome)),
            m('.results-cell', [
              m(VoteListing, {
                proposal,
                votes: votes.filter((v) => signalingVoteToString(v.choices[0]) === signalingVoteToString(outcome))
              })
            ])
          ]);
        }),
      ]);
    } else if (proposal.votingType === VotingType.SimpleYesNoVoting) {
      return m('.ProposalVotingResults', [
        m('.results-column', [
          m('.results-header', 'Voted yes'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === true) })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', 'Voted no'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === false) })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.MolochYesNo) {
      return m('.ProposalVotingResults', [
        m('.results-column', [
          m('.results-header', 'Voted yes'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MolochVote.YES)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', 'Voted no'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MolochVote.NO)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      return m('.ProposalVotingResults', [
        m('.results-column', [
          m('.results-header', 'Voted yes'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === true),
              amount: true,
              weight: true
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', 'Voted no'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === false),
              amount: true,
              weight: true
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
      return m('.ProposalVotingResults', [
        m('.results-column', [
          m('.results-header', 'Voted yes'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.YES)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', 'Voted no'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.NO)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', 'Voted abstain'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.ABSTAIN)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', 'Voted veto'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.VETO)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting
               && proposal instanceof CosmosProposal) {
      // special case for cosmos proposals in deposit stage
      return m('.ProposalVotingResults', [
        m('.results-column', [
          m('.results-header', 'Voted to approve'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: proposal.depositorsAsVotes
            })
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
      return m('.ProposalVotingResults', [
        m('.results-column', [
          m('.results-header', 'Voted to approve'),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes
            })
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.RankedChoiceVoting) {
      // to be implemented
    } else {
      // to be implemented
    }
  }
};

export default ProposalVotingResults;
