import 'components/proposals/voting_results.scss';
import m from 'mithril';

import { formatCoin } from 'adapters/currency'; // TODO: remove formatCoin, only use coins.format()
import User from 'views/components/widgets/user';
import { VotingType, VotingUnit, IVote, DepositVote, BinaryVote, AnyProposal } from 'models';
import { CosmosVote, CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { CosmosVoteChoice } from 'controllers/chain/cosmos/types';
import { MolochProposalVote, MolochVote } from 'controllers/chain/ethereum/moloch/proposal';
import { MarlinProposalVote, MarlinVote } from 'controllers/chain/ethereum/marlin/proposal';
import { SubstrateCollectiveVote } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateDemocracyVote } from 'controllers/chain/substrate/democracy_referendum';

const COLLAPSE_VOTERS_AFTER = 6; // if there are >6 voters, collapse remaining under "Show more"

const VoteListing: m.Component<{
  proposal: AnyProposal,
  votes : Array<IVote<any>>,
  amount?: boolean,
  weight?: boolean
}, {
  balancesCache,
  balancesCacheInitialized,
}> = {
  view: (vnode) => {
    const { proposal, votes, amount, weight } = vnode.attrs;
    const balanceWeighted = proposal.votingUnit === VotingUnit.CoinVote
      || proposal.votingUnit === VotingUnit.ConvictionCoinVote;

    if (!vnode.state.balancesCache) vnode.state.balancesCache = {};
    if (!vnode.state.balancesCacheInitialized) vnode.state.balancesCacheInitialized = {};

    return m('.VoteListing', [
      votes.length === 0
        ? m('.no-votes', 'No votes')
        : votes.map(
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
                vote.account.balance.then((b) => {
                  balance = b;
                  vnode.state.balancesCache[vote.account.address] = formatCoin(b, true);
                  m.redraw();
                });
                balance = '--';
              }
            }
            switch (true) {
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
    ]);
  }
};

const VotingResults: m.Component<{ proposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const votes = proposal.getVotes();

    // TODO: fix up this function for cosmos votes
    if (proposal.votingType === VotingType.SimpleYesNoVoting) {
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Yes (${votes.filter((v) => v.choice === true).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === true)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `No (${votes.filter((v) => v.choice === false).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === false)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.MolochYesNo) {
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Yes (${votes.filter((v) => v.choice === MolochVote.YES).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MolochVote.YES)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `No (${votes.filter((v) => v.choice === MolochVote.NO).length})`),
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
          m('.results-header', `Yes (${votes.filter((v) => v.choice === MarlinVote.YES).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MarlinVote.YES)
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `No (${votes.filter((v) => v.choice === MarlinVote.NO).length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === MarlinVote.NO)
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Yes (${votes.filter((v) => v.choice === true).length})`),
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
          m('.results-header', `No (${votes.filter((v) => v.choice === false).length})`),
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
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Voted yes (${votes.filter((v) => v.choice === 'Yes').length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === 'Yes')
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `Voted no (${votes.filter((v) => v.choice === 'No').length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === 'No')
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `Voted abstain (${votes.filter((v) => v.choice === 'Abstain').length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === 'Abstain')
            })
          ]),
        ]),
        m('.results-column', [
          m('.results-header', `Voted veto (${votes.filter((v) => v.choice === 'NoWithVeto').length})`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: votes.filter((v) => v.choice === 'NoWithVeto')
            })
          ]),
        ])
      ]);
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting
               && proposal instanceof CosmosProposal) {
      // special case for cosmos proposals in deposit stage
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Approved ${proposal.depositorsAsVotes.length}`),
          m('.results-cell', [
            m(VoteListing, {
              proposal,
              votes: proposal.depositorsAsVotes
            })
          ]),
        ]),
      ]);
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
      return m('.VotingResults', [
        m('.results-column', [
          m('.results-header', `Approved ${votes.length}`),
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

export default VotingResults;
