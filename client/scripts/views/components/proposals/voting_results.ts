import 'components/proposals/voting_results.scss';
import app from 'state';
import m from 'mithril';
import { VoteOutcome } from '@edgeware/node-types';
import { u8aToString } from '@polkadot/util';

import { formatCoin } from 'adapters/currency'; // TODO: remove formatCoin, only use coins.format()
import User from 'views/components/widgets/user';
import { VotingType, VotingUnit, IVote, DepositVote, BinaryVote, AnyProposal } from 'models';
import { SignalingVote, EdgewareSignalingProposal } from 'controllers/chain/edgeware/signaling_proposal';
import { first } from 'rxjs/operators';
import { CosmosVote, CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { CosmosVoteChoice } from 'adapters/chain/cosmos/types';
import { MolochProposalVote, MolochVote } from 'controllers/chain/ethereum/moloch/proposal';
import { MarlinProposalVote, MarlinVote } from 'controllers/chain/ethereum/marlin/proposal';
import { SubstrateCollectiveVote } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateDemocracyVote } from 'controllers/chain/substrate/democracy_referendum';

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
  balancesCache,
  balancesCacheInitialized,
}> = {
  view: (vnode) => {
    const { proposal, votes, amount, weight } = vnode.attrs;
    const balanceWeighted = proposal.votingUnit === VotingUnit.CoinVote
      || proposal.votingUnit === VotingUnit.ConvictionCoinVote;
    const displayedVotes = vnode.state.expanded
      ? votes
      : votes.slice(0, 3);

    if (!vnode.state.balancesCache) vnode.state.balancesCache = {};
    if (!vnode.state.balancesCacheInitialized) vnode.state.balancesCacheInitialized = {};

    return m('.VoteListing', [
      (displayedVotes.length === 0)
        ? m('.no-votes', 'No votes')
        : displayedVotes.map(
          (vote) => {
            let balance;
            if (balanceWeighted && !(vote instanceof CosmosVote)) {
              // fetch and display balances
              if (vnode.state.balancesCache[vote.account.address]) {
                balance = vnode.state.balancesCache[vote.account.address];
              } else if (vnode.state.balancesCacheInitialized[vote.account.address]) {
                // do nothing, fetch already in progress
                balance = '--';
              } else {
                // fetch balance and store in cache
                vnode.state.balancesCacheInitialized[vote.account.address] = true;
                vote.account.balance.pipe(first()).toPromise().then((b) => {
                  balance = b;
                  vnode.state.balancesCache[vote.account.address] = formatCoin(b, true);
                  m.redraw();
                });
                balance = '--';
              }
            }
            switch (true) {
              case (vote instanceof SignalingVote):
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                  m('.vote-choice', signalingVoteToString((vote as SignalingVote).choices[0])),
                  (balanceWeighted && balance) && m('.vote-balance', balance),
                ]);
              case (vote instanceof BinaryVote):
                switch (true) {
                  case (vote instanceof SubstrateDemocracyVote):
                    return m('.vote', [
                      m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                      m('.vote-balance', formatCoin((vote as SubstrateDemocracyVote).balance, true)),
                      m('.vote-weight', (vote as SubstrateDemocracyVote).weight
                        && `${(vote as SubstrateDemocracyVote).weight}x`),
                    ]);
                  case (vote instanceof SubstrateCollectiveVote):
                    return m('.vote', [
                      m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                    ]);
                  default:
                    return m('.vote', [
                      m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                      m('.vote-balance', (vote as any).amount && (vote as any).amount),
                      m('.vote-weight', (vote as any).weight && `${(vote as any).weight}x`),
                    ]);
                }
              case (vote instanceof DepositVote):
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                  m('.vote-deposit', formatCoin((vote as DepositVote<any>).deposit, true)),
                ]);
              case (vote instanceof CosmosVote):
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                  m('.vote-choice', (vote as CosmosVote).choice.toString()),
                  // (balanceWeighted && balance) && m('.vote-balance', balance),
                ]);
              case (vote instanceof MolochProposalVote):
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true })),
                  m('.vote-choice', (vote as MolochProposalVote).choice.toString()),
                  balance && m('.vote-balance', balance),
                ]);
              case (vote instanceof MarlinProposalVote):
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true })),
                  m('.vote-choice', (vote as MarlinProposalVote).choice.toString()),
                  balance && m('.vote-balance', balance),
                ]);
              default:
                return m('.vote', [
                  m('.vote-voter', m(User, { user: vote.account, linkify: true, popover: true })),
                ]);
            }
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
          m('.results-header', `Voted yes (${votes.filter((v) => v.choice === true).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === true)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `Voted no (${votes.filter((v) => v.choice === false).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === false)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.MolochYesNo) {
      return m('.ProposalVotingResults', [
        m('.results-column', [
          m('.results-header', `Voted yes (${votes.filter((v) => v.choice === MolochVote.YES).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MolochVote.YES)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `Voted no (${votes.filter((v) => v.choice === MolochVote.NO).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MolochVote.NO)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.MarlinYesNo) {
      return m('.ProposalVotingResults', [
        m('.results-column', [
          m('.results-header', `Voted yes (${votes.filter((v) => v.choice === MarlinVote.YES).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MarlinVote.YES)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `Voted no (${votes.filter((v) => v.choice === MarlinVote.NO).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MarlinVote.NO)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      return m('.ProposalVotingResults', [
        m('.results-column', [
          m('.results-header', `Voted yes (${votes.filter((v) => v.choice === true).length})`),
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
          m('.results-header', `Voted no (${votes.filter((v) => v.choice === false).length})`),
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
          m('.results-header', `Voted yes (${votes.filter((v) => v.choice === CosmosVoteChoice.YES).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.YES)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `Voted no (${votes.filter((v) => v.choice === CosmosVoteChoice.NO).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.NO)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `Voted abstain (${votes.filter((v) => v.choice === CosmosVoteChoice.ABSTAIN).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === CosmosVoteChoice.ABSTAIN)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `Voted veto (${votes.filter((v) => v.choice === CosmosVoteChoice.VETO).length})`),
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
          m('.results-header', `Voted to approve ${proposal.depositorsAsVotes.length}`),
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
          m('.results-header', `Voted to approve ${votes.length}`),
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
